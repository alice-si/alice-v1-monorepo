exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  capabilities: {
    browserName: 'chrome',
    count: 2,
    chromeOptions: {
      args: ['--window-size=1600,1200']
    }
  },
  specs: [
    './specs/multiple.js'
  ],
  params: {
    host: 'http://localhost:8080',
    count: 10,
    user: 'tester@alice.si',
    password: 'Tester123'
  }
};