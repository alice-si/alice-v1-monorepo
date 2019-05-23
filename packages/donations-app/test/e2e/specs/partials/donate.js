module.exports = {

  test: function () {
    var projectCode = 'save-from-abuse';
    var EC = protractor.ExpectedConditions;

    describe('donate', function () {
      it('should navigate to project page', function () {
        browser.waitForAngular();

        // TODO in future we should implement clicking
        browser.getCurrentUrl().then(function (oldUrl) {
          const url = oldUrl + 'project/' + projectCode;
          browser.get(url);
          browser.waitForAngular();
          expect(browser.getCurrentUrl()).toContain('/project/' + projectCode);
        });

        // var projectLinkSelector = by.css('[href="/#/project/' + projectCode + '"]');
        // if (!element(projectLinkSelector).isDisplayed()) {
        //   element(by.css('[role="button"]')).click();
        // }

        // element.all(projectLinkSelector).count().then(function (result) {
        //   //Depending on wheter carousel plugin(outside of angular) manages to create widget
        //   if (result > 1) {
        //     element.all(projectLinkSelector).get(1).click();
        //   } else {
        //     element(projectLinkSelector).click();
        //   }
        //   expect(browser.getCurrentUrl()).toContain('/project/' + projectCode);
        // });
      });


      it('should navigate to donation page', function () {
        const donateButton = element.all(by.css("[href*=\"checkout\"]")).get(1);
        donateButton.click();
        expect(browser.getCurrentUrl()).toContain('/checkout/' + projectCode);
      });

      it('should donate', function () {

        $('#donate-amount-10 ins').click();
        element(by.id('donate-card-number')).clear().sendKeys("3569990000000124");
        element(by.id('donate-expiry-date')).clear().sendKeys("11/20");
        element(by.id('donate-cvc')).clear().sendKeys("123");

        element(by.id('donate-pay-button')).click();
      });

      it('should show confirmation', function () {
        expect(element(by.id('donation-question-modal')).isDisplayed()).toBe(true);
        element(by.id('close-question-button')).click();
        browser.waitForAngular();
        expect(element(by.id('donation-question-modal')).isPresent()).toBe(false);
      });

      it('should navigate to My Impact', function () {
        browser.wait(function () {
          return browser.getCurrentUrl().then(function (url) {
            return /my-impact/.test(url);
          });
        }, 10000);

        expect(browser.getCurrentUrl()).toContain('/my-impact');
      });

      it('should show confirmation', function () {
        var modal = element(by.id('donation-confirmation-modal'));
        expect(modal.isDisplayed()).toBe(true);
        element(by.id('close-confirmation-button')).click();
        if (modal.isPresent()) {
          browser.wait(EC.invisibilityOf(modal), 5000);
        }
        expect(modal.isPresent()).toBe(false);
      });

    });
  }
};