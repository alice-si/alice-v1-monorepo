module.exports = {

  test: function () {
    describe('logout', function () {

      it('should logout and clear user data', function () {
        element(by.id('menu-top')).click();
        element(by.id('menu-logout')).click();

        expect(element(by.id('menu-login')).isDisplayed()).toBe(true);

      });

    });
  }
};