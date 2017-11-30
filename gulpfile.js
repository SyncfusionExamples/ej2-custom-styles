var fs = require('fs');
var path = require('path');
var glob = require('glob');
var gulp = require('gulp');
var shelljs = require('shelljs');

gulp.task('styles', function(done) {
    var inquirer = require('inquirer');
    inquirer
        .prompt([{
            type: 'checkbox',
            message: 'Select Essential JS 2 Packages for Custom Styles',
            name: 'packages',
            pageSize: 16,
            choices: [
                new inquirer.Separator('\n\n******* Essential JS 2 Packages *******\n\n'),
                {
                    name: '@syncfusion/ej2-buttons'
                },
                {
                    name: '@syncfusion/ej2-calendars'
                },
                {
                    name: '@syncfusion/ej2-charts'
                },
                {
                    name: '@syncfusion/ej2-circulargauge'
                },
                {
                    name: '@syncfusion/ej2-dropdowns'
                },
                {
                    name: '@syncfusion/ej2-grids'
                },
                {
                    name: '@syncfusion/ej2-inputs'
                },
                {
                    name: '@syncfusion/ej2-lineargauge'
                },
                {
                    name: '@syncfusion/ej2-lists'
                },
                {
                    name: '@syncfusion/ej2-navigations'
                },
                {
                    name: '@syncfusion/ej2-popups'
                }
            ],
            validate: function(answer) {
                if (answer.length < 1) {
                    return 'You must choose at least one package';
                }
                return true;
            }
        }])
        .then(answer => {
            // Remove previously generated theme files
            shelljs.rm('-rf', './styles/themes/');
            var themes = ['bootstrap', 'fabric', 'material'];
            var template = fs.readFileSync('./styles/templates/base', 'utf8');
            // Get dependent component styles
            var packs = getDependentStyles(answer.packages);
            for (var i = 0; i < themes.length; i++) {
                var componentStyles = '';
                var themeContent = template.replace(/{themename}/g, themes[i]);
                for (var j = 0; j < packs.length; j++) {
                    var stylePath = 'node_modules/' + packs[j] + '/styles/**/';
                    var styleFiles = glob.sync('{' + stylePath + 'bootstrap.scss,' + stylePath + 'fabric.scss,' + stylePath + 'material.scss}', { ignore: 'node_modules/' + packs[j] + '/styles/*.scss' })
                    // Create component mapping files
                    createComponentStyles(styleFiles, themes[i]);
                }
                var components = fs.readdirSync('./styles/themes/' + themes[i]);
                var componentStyles = components.map(function(file) {
                    return '@import \'themes/' + themes[i] + '/' + file + '\';\n';
                });
                fs.writeFileSync('./styles/' + themes[i] + '.scss', themeContent + '\n' + componentStyles.join(''));
            }

            // Compile custom files with custom defintions
            var gutil = require('gulp-util');
            var sass = require('gulp-sass');
            gulp.src(['./styles/**/*.scss'], { base: './' })
                .pipe(sass({
                    outputStyle: 'expanded',
                    includePaths: ["./node_modules/@syncfusion/"]
                }).on('error', function(error) {
                    isCompiled = false;
                    gutil.log(new gutil.PluginError('sass', error.messageFormatted).toString());
                    this.emit('end');
                }))
                .pipe(gulp.dest('.'))
                .on('end', function() {
                    console.log('\n\n!!! Custom Styles Successfully Compiled !!!\n\n');
                    done();
                });
        });
});

// Components mapping template content
var compTemplate = fs.readFileSync('./styles/templates/component', 'utf8');
var compAllTemplate = fs.readFileSync('./styles/templates/component-all', 'utf8');
var compThemeTemplate = fs.readFileSync('./styles/templates/component-theme', 'utf8');
var compDefaultTemplate = fs.readFileSync('./styles/templates/component-default', 'utf8');

function createComponentStyles(styleFiles) {
    for (var i = 0; i < styleFiles.length; i++) {
        var componentStyle;
        var themeName = path.basename(styleFiles[i], '.scss');
        var themePath = './styles/themes/' + themeName;
        if (!fs.existsSync(themePath)) {
            shelljs.mkdir('-p', themePath);
        }
        var dirPath = path.dirname(styleFiles[i]);
        var dirArray = dirPath.split('/');
        var component = dirArray[dirArray.length - 1];
        var componentPath = dirPath.replace('node_modules/@syncfusion/', '');
        if (fs.existsSync(dirPath + '/_' + themeName + '-definition.scss') && fs.existsSync(dirPath + '/_definition.scss')) {
            componentStyle = compAllTemplate.replace(/{componentpath}/g, componentPath).replace(/{themename}/g, themeName);
        } else if (fs.existsSync(dirPath + '/_' + themeName + '-definition.scss') && !fs.existsSync(dirPath + '/_definition.scss')) {
            componentStyle = compThemeTemplate.replace(/{componentpath}/g, componentPath).replace(/{themename}/g, themeName);;
        } else if (fs.existsSync(dirPath + '/_definition.scss')) {
            componentStyle = compDefaultTemplate.replace(/{componentpath}/g, componentPath);
        } else {
            componentStyle = compTemplate.replace(/{componentpath}/g, componentPath);
        }
        var stylePath = themePath + '/_' + component + '.scss';
        fs.writeFileSync(stylePath, componentStyle);
    }
}

function getDependentStyles(packages) {
    var finalComponents = packages;
    for (var i = 0; i < packages.length; i++) {
        var packJSON = JSON.parse(fs.readFileSync('./node_modules/' + packages[i] + '/package.json', 'utf8'));
        var depKeys = Object.keys(packJSON.dependencies);
        for (var j = 0; j < depKeys.length; j++) {
            var deps = depKeys[j];
            if (deps.indexOf('@syncfusion') !== -1 && finalComponents.indexOf(deps) === -1 &&
                deps !== '@syncfusion/ej2-base' && fs.existsSync('./node_modules/' + deps + '/styles')) {
                finalComponents.push(deps);
            }
        }
    }
    return finalComponents;
}