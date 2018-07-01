# Custom Style Generator for Essential JS 2 Components

> Syncfusion is now officially rolled out the ThemeStudio for Essential JS 2 components to customize its styles. So we suggest you to use the [ThemeStudio](https://ej2.syncfusion.com/themestudio/) web tool instead of this plugin to generate the custom theme.

## Installing

To install the dependent packages, use the below command.

> npm install

## Customizing Themes

- The Essential JS 2 components style variables are already declared in the [`styles/definition`](https://github.com/SyncfusionSamples/ej2-custom-styles/tree/master/styles/definition) location, categorized by theme name.

- You can change the specific variable's color value to generate the customized theme.

For example, Changing `$accent` and `$primary` variable colors in material theme definition will generate a customized material theme with provided color changes.

```scss
$accent: #FFAB40;
$primary: #9C27B0;
```

- Now run the below command and choose the `Essential JS 2` packages for creating custom styles.

> npm run compile

- After executing the above command, the final output `{theme-name}.css` files will be created under [`styles`](https://github.com/SyncfusionSamples/ej2-custom-styles/tree/master/styles) location.

![demo](images/demo.gif)
