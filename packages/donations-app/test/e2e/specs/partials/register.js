module.exports = {

  test: function () {
    var user = {
      firstName: 'Tom',
      lastName: 'Tester',
      password: 'Alice123',
      dateOfBirth: '19/09/1983'
    };

    function generateEmail() {
      return Math.random().toString(36).substring(4) + Math.random().toString(36).substring(4) + '@gmail.com'
    }

    user.email = generateEmail();

    var EC = protractor.ExpectedConditions;

    describe('register', function () {
      browser.waitForAngularEnabled(true);

      it('should register', function () {
        browser.get(browser.params.host);

        element(by.id('menu-login')).click();
        element(by.id('login-start-registration')).click();

        browser.wait(EC.visibilityOf(element(by.id('registration-first-name'))), 5000);
        element(by.id('registration-first-name')).sendKeys(user.firstName);
        element(by.id('registration-last-name')).sendKeys(user.lastName);
        element(by.id('registration-date-of-birth')).sendKeys(user.dateOfBirth);
        element(by.id('registration-nationality')).sendKeys('U' + protractor.Key.ENTER);
        element(by.id('registration-residence')).sendKeys('U' + protractor.Key.ENTER);
        element(by.id('registration-email')).sendKeys(user.email);
        element(by.id('registration-password')).sendKeys(user.password);
        element(by.id('registration-password-confirmation')).sendKeys(user.password);

        element(by.id('registration-sign-up-button')).click();

        expect(element(by.id('menu-top')).getText()).toEqual(user.firstName + ' ' + user.lastName);

      });

      it('should close welcome', function () {
        var modal = element(by.id('welcome-modal'));
        browser.wait(EC.visibilityOf(modal), 5000);
        expect(modal.isDisplayed()).toBe(true);
        element(by.id('close-welcome-button')).click();
        browser.wait(EC.invisibilityOf(modal), 5000);
        expect(modal.isPresent()).toBe(false);
      });

    });
  }
};