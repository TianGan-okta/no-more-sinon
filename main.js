const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const program = require('commander');
const glob = require('glob');
const prettier = require('prettier');

const pDeDupBeforeEach = require('./src/index');

function convert(filePath, options) {
  // read the code from this file
  const context = fs.readFileSync(filePath, 'utf-8');

  // use our plugin to transform the source
  let state = { ignore: true };
  let result = babel.transform(context, {
    plugins: [
      "@babel/plugin-syntax-object-rest-spread",
      [pDeDupBeforeEach, state],
    ],
  });


  console.log(`Processing ${filePath}`);
  if (options.dryrun) {
    return;
  }
  result = prettier.format(result.code, {
    useTabs: false,
    printWidth: 120,
    tabWidth: 2,
    singleQuote: true,
    trailingComma: 'es5',
    bracketSpacing: true,
    parser: 'babel',
    semi: true,
  });

  if (options.modify) {
    fs.writeFileSync(filePath, result);
  } else {
    console.log('Does not change file as modify in place option is not enabled. done.');
  }

};

function main() {
  program
    .option('-p --path <path>',
      'target file or directory to be converted.')
    .option('-m --modify',
      'modify target file(s) in place. Default to False.',
      false)
    .option('-d --dryrun',
      'nothing actual changes will happen',
      false)
    .parse(process.argv);

  if (!program.path) {
    console.error('must specify an target file or dir');
    process.exit(1);
  }

  const fileStat = fs.statSync(program.path);

  let inputFiles;
  if (fileStat.isDirectory()) {
    inputFiles = glob.sync('**/*_spec.js', { cwd: program.path })
      .map(f => path.join(program.path, f));
  } else if (fileStat.isFile()) {
    inputFiles = [program.path];
  } else {
    console.error(`can not find target file${program.path}`);
    process.exit(1);
  }

  let success = 0;
  let failure = 0;

  inputFiles.forEach((srcFile) => {
    try {
      convert(srcFile, {
        dryrun: program.dryrun,
        modify: program.modify,
      });
      success += 1;
    } catch (e) {
      const msg = e.message;
      console.error(`Unable to compile ${srcFile}\n\tError: ${msg}`);
      // display multiple errors isn't quite useful but distraction.
      // I suppose when many files got failure, you'll dig into error one by one.
      if (inputFiles.length === 1) {
        console.error(e);
      }
      failure += 1;
    }
  });

  console.log('========== CONVERSION COMPLETE ==========');
  console.log(`success: ${success}`);
  console.log(`failure: ${failure}`);
}

module.exports = main;
