import * as chalk from 'chalk';

export default {
  log(...args) {
    console.log(chalk.bgBlue(' INFO '), ...args);
  },
  warn(...args) {
    console.log(chalk.bgRedBright(' WARN '), ...args);
  },
  error(...args) {
    console.log(chalk.bgRed(' ERROR '), ...args);
  },
};
