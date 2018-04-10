var fs = require('fs');
var path = require('path');
var glob = require('glob');
var gulp = require('gulp');
var shelljs = require('shelljs');
var componentDeps = JSON.parse(fs.readFileSync('./dependencies.json', 'utf8'));

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
                    name: '@syncfusion/ej2-cards',
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
                    name: '@syncfusion/ej2-maps'
                },
                {
                    name: '@syncfusion/ej2-navigations'
                },
                {
                    name: '@syncfusion/ej2-popups'
                },
                {
                    name: '@syncfusion/ej2-schedule'
                },
                {
                    name: '@syncfusion/ej2-splitbuttons'
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
            var themes = ['bootstrap', 'fabric', 'highcontrast', 'material'];
            var template = fs.readFileSync('./styles/templates/base', 'utf8');
            // Get dependent component styles
            // packages = ['@syncfusion/ej2-buttons', '@syncfusion/ej2-calendars', '@syncfusion/ej2-charts', '@syncfusion/ej2-circulargauge', '@syncfusion/ej2-dropdowns',
            //     '@syncfusion/ej2-grids', '@syncfusion/ej2-inputs', '@syncfusion/ej2-lineargauge', '@syncfusion/ej2-lists', '@syncfusion/ej2-navigations', '@syncfusion/ej2-popups'
            // ]
            var packs = getDependentStyles(answer.packages);
            for (var i = 0; i < themes.length; i++) {
                var componentStyles = '';
                var themeContent = template.replace(/{themename}/g, themes[i]);
                for (var j = 0; j < packs.length; j++) {
                    var stylePath = 'node_modules/' + packs[j] + '/styles/**/';
                    var styleFiles = glob.sync('{' + stylePath + 'bootstrap.scss,' + stylePath + 'fabric.scss,' + stylePath + 'material.scss,' + stylePath + 'highcontrast.scss}', { ignore: 'node_modules/' + packs[j] + '/styles/*.scss' })
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
                    })
                    .on('error', function(error) {
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
        var packageName = dirArray[2];
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
        componentStyle = getDependencies(componentStyle, themeName, packageName, component);
        var stylePath = themePath + '/_' + component + '.scss';
        fs.writeFileSync(stylePath, componentStyle);
    }
}

function getDependencies(componentStyle, themeName, packageName, component) {
    var dependencies = componentDeps[packageName][component];
    var deps = '';
    for (var i = 0; i < dependencies.length; i++) {
        var styleModule, pack = dependencies[i];
        if (pack.indexOf('/') !== -1) {
            styleModule = pack.split('/')[1];
            deps += '@import "_' + styleModule + '.scss";\n';
        } else {
            var keys = Object.keys(componentDeps[pack]);
            for (var j = 0; j < keys.length; j++) {
                deps += '@import "_' + keys[j] + '.scss";\n';
            }
        }
    }
    var finalStyle = componentStyle.replace(/{Dependencies}/g, deps);
    return finalStyle;
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