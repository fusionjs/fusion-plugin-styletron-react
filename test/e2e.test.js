// @noflow

/* eslint-env jest, node, browser */

const child_process = require('child_process');
const {promisify} = require('util');
const path = require('path');
const getPort = require('get-port');
const puppeteer = require('puppeteer');

const execFile = promisify(child_process.execFile);
const spawn = child_process.spawn;

const fixture = path.join(__dirname, './fixtures/basic');

test('basic rendering and hydration works', async () => {
  const env = Object.assign({}, process.env, {NODE_ENV: 'production'});

  const [port] = await Promise.all([
    getPort(),
    execFile('fusion', ['build'], {cwd: fixture, env}),
  ]);

  const server = spawn('fusion', ['start', `--port=${port}`], {
    stdio: 'inherit',
    cwd: fixture,
    env,
  });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await untilReady(page, port);

  expect((await getComputedStyle(page, '#styled')).color).toEqual(
    'rgb(255, 0, 0)'
  );
  expect((await getStyles(page)).length).toBe(1);

  await page.click('#toggle');
  expect((await getComputedStyle(page, '#styled')).color).toEqual(
    'rgb(0, 0, 255)'
  );
  expect((await getStyles(page)).length).toBe(2);

  await page.click('#toggle');
  expect((await getComputedStyle(page, '#styled')).color).toEqual(
    'rgb(255, 0, 0)'
  );
  expect((await getStyles(page)).length).toBe(2);

  server.kill();
  browser.close();
}, 30000);

function getStyles(page) {
  return page.evaluate(() => {
    return Array.from(document.styleSheets).flatMap(sheet =>
      Array.from(sheet.cssRules).flatMap(rule => rule.cssText)
    );
  });
}

function getComputedStyle(page, selector) {
  return page.$eval(selector, el =>
    JSON.parse(JSON.stringify(getComputedStyle(el)))
  );
}

async function untilReady(page, port) {
  let started = false;
  let numTries = 0;
  while (!started && numTries < 50) {
    try {
      await page.goto(`http://localhost:${port}`);
      started = true;
    } catch (e) {
      numTries++;
    }
  }
}
