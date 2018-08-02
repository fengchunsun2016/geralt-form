/**
 * Created by fengchunsun on 2018/4/20.
 */


const webpack = require('webpack');
/*const htmlWebpackPlugin = require('html-webpack-plugin');
let extractTextWebpackPlugin = require('extract-text-webpack-plugin');
let extract = new extractTextWebpackPlugin('build.css');  //打包抽离的css文件名*/

module.exports = {
  entry : {
    one : __dirname + "/src/index.js", //入口文件的路径
    //two : __dirname + "/two/index.js"
  },
  output : {
    path : __dirname + "/js", //打包后文件的出口
    // filename : "[name]/index.js" //[name]全局变量，entry的属性名
    filename : "index.min.js" //[name]全局变量，entry的属性名
  },
  // devtool : 'source-map',  //生成map文件，可把报错指向源文件

  module : {
    rules : [
      {
        test : /(\.js|\.jsx)$/,
        use : {
          loader : 'babel-loader'
        },
        exclude : '/node_modules/'
      }/*,
      {
        test : /\.css$/,
        use : extract.extract({  //分离css代码
          fallback : 'style-loader',
          use : [{
            loader : 'css-loader'
          }, {
            loader : 'postcss-loader',
            options : {
              plugins: [
                require('autoprefixer') //添加css前缀
              ]
            }
          }
          ]
        })

      }*/

    ]
  },
  /*plugins:[
    extract,
    new webpack.BannerPlugin('版权所有！！！'),
    new htmlWebpackPlugin({
      filename:'one/index.html',  //输出文件的名字，不写默认index.html
      template:'./index.html',  //模板html路径
      chunks:['common','one']  //指定当前html要引入的文件（entry）
    }),
    new htmlWebpackPlugin({
      filename:'two/index.html',
      template:'./index.html',
      chunks:['common','two']
    }),

    //再根目录下生成，热加载用
    new htmlWebpackPlugin({
      filename:'index.html',
      template:'./index.html',
      chunks:['common',process.env.ROOT] //package.json的dev配置的set ROOT=
    }),

    // 提供公共代码
    new webpack.optimize.CommonsChunkPlugin('common'), // 默认会把所有入口节点的公共代码提取出来
  ]*/

}