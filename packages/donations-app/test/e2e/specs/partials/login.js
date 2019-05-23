module.exports = {

  test: function () {
    describe('login', function () {

      it('should login', function () {
        browser.get(browser.params.host);
        browser.waitForAngular();

        element(by.id('menu-login')).click();

        element(by.id('login-email')).sendKeys(browser.params.user);
        element(by.id('login-password')).sendKeys(browser.params.password);

        element(by.id('login-button')).click();

        expect(element(by.id('menu-login')).isDisplayed()).toBe(false);
        expect(element(by.id('menu-top')).getText()).toContain('Tom Tester');

      });

    });
  }

};
