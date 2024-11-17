
#esbuild #bundler

## Что это такое?

ESBuild - это сборщик пакетов

Преимущества:
- Он простой
- Он быстрый
- Минималистичный
- Достаточно новый и на современных технологиях

Из недостатков можно выделить то, что у него меньше решений различных вопросов (нет настройки css modules) и чуть меньше коммюнити

## Как стартовать?

Стандартно, команда для сборки приложения выглядит следующим образом:
- что собираем
- какой тип сборки
- папка с результатом сборки

```bash
esbuild ./src/index.js --bundle --outdir="dist"
```

## Конфигурация

ESBuild смотрит так же на нашу конфигурацию TS

`tsconfig.json`
```JSON
{
  "compilerOptions": {
    // куда собираем
    "outDir": "./build/",
    // запрет на any
    "noImplicitAny": true,
    "module": "ESNext",
    // в какой формат копилируем, в данном случае ecmascript 6
    "target": "es6",
    "jsx": "react-jsx",
    // Компилятор будет обрабатывать не только TS файлы, но и JS файлы
    "allowJs": true,
    // Строгий режим
    "strict": true,
    "esModuleInterop": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    // Обязательное поле при использовании с esbuild
    "isolatedModules": true
  },
  "ts-node": {
    "compilerOptions": {
      "module": "commonjs"
    }
  }
}
```

Чтобы собрать свой плагин для ESBuild, нам нужно создать инстанс Plugin, который будет иметь имя и поля со стейджами выполнения. Сами стейджи мы получаем из передаваемого параметра `build` (`onStart`, `onEnd` и тд)

Тут мы реализовали очистку dist перед рекомпиляцией приложения в эту папку.

`config / build / plugins / CleanPlugin.ts`
```TS
import {Plugin} from 'esbuild';
import {rm} from 'fs/promises';

export const CleanPlugin: Plugin = {
    name: 'CleanPlugin',
    setup(build) {
        build.onStart(async () => {
            try {
                const outdir = build.initialOptions.outdir;
                if(outdir) {
                    // АККУРАТНО!!!!
                    await rm(outdir, { recursive: true })
                }
            } catch (e) {
                console.log('Не удалось очистить папку')
            }
        })
    },
}
```

Далее нам нужно будет дефолтно вставить HTML-страницу для сборки приложения. Если в Webpack у нас есть плагин, который вставит наш код в нужный `index.html`, то в ESBuild нужно будет поработать и самому из JS сгенерировать нужный шаблон 

`config / build / plugins / HTMLPlugin.ts`
```TS
import {Plugin} from 'esbuild';
import {rm, writeFile} from 'fs/promises';
import path from 'path';

interface HTMLPluginOptions {
    template?: string;
    title?: string;
    jsPath?: string[];
    cssPath?: string[];
}

const renderHtml = (options: HTMLPluginOptions): string => {
    return options.template || `
      <!doctype html>
      <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport"
                    content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="ie=edge">
              <title>${options.title}</title>
              ${options?.cssPath?.map(path => `<link href=${path} rel="stylesheet">`).join(" ")}
          </head>
          <body>
              <div id="root"></div>
              ${options?.jsPath?.map(path => `<script src=${path}></script>`).join(" ")}
              <script>
              const evtSource = new EventSource('http://localhost:3000/subscribe')
             evtSource.onopen = function () { console.log('open') }
             evtSource.onerror = function () { console.log('error') }
             evtSource.onmessage = function () { 
                  console.log('message')
                  window.location.reload();
              }
             
             </script>
          </body>
      </html>
                    `
}

const preparePaths = (outputs: string[]) => {
    return outputs.reduce<Array<string[]>>((acc, path) => {
        const [js, css] = acc;
        const splittedFileName = path.split('/').pop();

        if(splittedFileName?.endsWith('.js')) {
            js.push(splittedFileName)
        } else if(splittedFileName?.endsWith('.css')) {
            css.push(splittedFileName)
        }

        return acc;
    }, [[], []])
}

export const HTMLPlugin = (options: HTMLPluginOptions): Plugin => {
  return {
      name: 'HTMLPlugin',
      setup(build) {
          const outdir = build.initialOptions.outdir;

          build.onStart(async () => {
              try {
                  if(outdir) {
                      await rm(outdir, { recursive: true })
                  }
              } catch (e) {
                  console.log('Не удалось очистить папку')
              }
          })
          build.onEnd(async (result) => {
              const outputs = result.metafile?.outputs;
              const [jsPath, cssPath] = preparePaths(Object.keys(outputs || {}));

              if(outdir) {
                  await writeFile(
                      path.resolve(outdir, 'index.html'),
                      renderHtml({ jsPath, cssPath, ...options})
                  )
              }
          })
      },
  }
}
```

Так у нас будет выглядеть конфигурация ESBuild, в которой нам нужно будет указать основные поля для сборки

`config / build / esbuild-config.ts`
```TS
import ESBuild, {BuildOptions} from 'esbuild'
import path from 'path'
import {CleanPlugin} from './plugins/CleanPlugin';
import {HTMLPlugin} from "./plugins/HTMLPlugin";

const mode = process.env.MODE || 'development';

const isDev = mode === 'development';
const isProd = mode === 'production';

function resolveRoot(...segments: string[]) {
    return path.resolve(__dirname, '..', '..', ...segments)
}

const config: BuildOptions = {
    outdir: resolveRoot('build'),
    entryPoints: [resolveRoot( 'src', 'index.jsx')],
    entryNames: '[dir]/bundle.[name]-[hash]',
    allowOverwrite: true,
    bundle: true,
    tsconfig: resolveRoot('tsconfig.json'),
    minify: isProd,
    sourcemap: isDev,
    metafile: true,
    loader: {
        '.png': 'file',
        '.svg': 'file',
        '.jpg': 'file',
    },
    plugins: [
        CleanPlugin,
        HTMLPlugin({
            title: 'Ulbi tv',
        })
    ],
}

export default config;
```

## Сборка entry-поинтов в конфигурацию

И так же для упрощения вызова команды esbuild, нам стоит создать заранее файлы, которые будут поднимать нам сборку (прод/разработка)

Дев сборка. Она в себя будет включать сервер ноды с Express, которая будет контролировать работу сборщика.

`config / build / esbuild-dev.ts`
```TS
import ESBuild from 'esbuild';
import path from 'path';
import config from './esbuild-config';
import express from 'express';
import {EventEmitter} from 'events';

const PORT = Number(process.env.PORT) || 3000;

const app = express();
const emitter = new EventEmitter();

app.use(express.static(path.resolve(__dirname, '..', '..', 'build')))

app.get('/subscribe', (req, res) => {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);
    res.write('');

    emitter.on('refresh', () => {
        res.write('data: message \n\n')
    })
})

function sendMessage() {
    emitter.emit('refresh', '123123')
}

app.listen(PORT, () => console.log('server started on http://localhost:' + PORT))

ESBuild.build({
    ...config,
    watch: {
        onRebuild(err, result) {
            if(err) {
                console.log(err)
            } else {
                console.log('build...')
                sendMessage()
            }
        }
    }
}).then((result) => {
    console.log(result)
}).catch(err => {
    console.log(err);
})
```

Тут мы вызовем конфигурацию для production сборки, которая просто вернёт собранное приложение

`config / build / esbuild-prod.ts`
```TS
import ESBuild from 'esbuild';
import path from 'path';
import config from './esbuild-config';

ESBuild.build(config)
    .catch(console.log)
```

Вызывается каждая сборка достаточно просто. Нам нужно просто вызывать команду сборки конфига esbuild, который мы описали в файле

`package.json`
```JSON
"scripts": {
	"build": "cross-env MODE=production ts-node config/build/esbuild-prod.ts",
	"start": "ts-node config/build/esbuild-dev.ts"
},
```
