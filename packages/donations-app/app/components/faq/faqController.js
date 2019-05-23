angular.module('aliceApp')
  .controller('FaqController', ['AuthService', '$scope', '$stateParams', function (AuthService, $scope, $stateParams) {
    var vm = this;
  
    vm.questions = [
      {
        question: 'How do I know that goals are actually achieved?',
        answer: 'Every charity project must list the goals it plans to achieve, and how they will be validated on its appeal page. Usually, goals will be verified by an independent auditor or a public body.'
      },
      {
        question: 'How do I know when the charity has received my donation and which goals I’ve paid for?',
        answer: 'You’ll receive an email as soon as your gift has been paid to the charity whose project you donated to. You can also track the performance of your donation by clicking on “My Impact” in the menu bar.'
      },
      {
        question: 'My donation isn’t enough to pay for any of the goals on the project appeal page. Will the charity receive it?',
        answer: 'Some goals trigger payments that can only be paid to the charity that achieved it by pooling multiple donations together. That means that whether you give £1 or £5,000, your gift will always help pay for a goal, and you’ll know exactly which one.'
      },
      {
        question: 'Only part of my donation has been sent to the charity. Why?',
        answer: 'Some goals trigger only small payments to the charity that achieves it, and your full donation may not be sent to the charity in one go. That means means you get to contribute to more than one goal. Well done!'
      },
      {
        question: 'What happens to my donation if the project I gave to doesn’t achieve its goals?',
        answer: 'If a project doesn’t achieve its goals, or if it doesn’t achieve enough goals to receive your full donation, you will be given the option to either get a refund for the amount that\'s left over, or to donate it to the charity for general purposes.'
      },
      {
        question: 'How can a charity run a project before receiving any money?',
        answer: 'Some charities have enough financial resources that they can afford to run a project before receiving payments. Smaller charities generally can’t, so some projects on Alice will require you to give part of your donation up front. That way the charity can start the project immediately, but will receive the rest of your gift only when it achieves its goals. Some charities also secure initial loans from social impact investors, that they pay back once they get payment for the goals they achieve.'
      },
      {
        question: 'How do you calculate how much a charity will receive for each goal?',
        answer: 'Alice does not decide how much each goal is worth. Each charity calculates how much each goal will cost them to achieve, and must give a break-down on the project’s appeal page so donors are fully informed.'
      },
      {
        question: 'What is blockchain technology, and why does Alice use it?',
        answer: 'Alice uses blockchain technology to make the impact of charity projects completely transparent to donors. A blockchain is a distributed database that is resistant to hacking and tampering, which makes it very hard to cook the books. For added security, Alice is built on a public blockchain called Ethereum, so that all the information about the goals that a project achieves is available for anyone to verify for themselves.'
      },
      {
        question: 'What is Ethereum?',
        answer: 'Ethereum is the public blockchain that powers Alice. It allows us to build ‘smart contracts’ that make all the charity projects on the platform extremely transparent. You can find out more about Ethereum <span class="question-link"><a href="https://www.ethereum.org/" target="_blank">here</a></span>.'
      },
      {
        question: 'What is a smart contract?',
        answer: 'Smart contracts are computer programmes that live on the blockchain, and can define strict conditions for things like how a charity can receive your donations. They benefit from all the qualities of the blockchain, meaning that they are very secure and fully transparent.'
      },
      {
        question: 'How do you put my donation on the blockchain? Do you convert into a cryptocurrency like Bitcoin or Ether? And if so, what happens if their value crashes?',
        answer: 'Alice doesn’t use cryptocurrencies like Bitcoin and Ether, because their value can be very volatile. We don’t want to run the risk of a £10 donation made today to be worth only £5 tomorrow! Instead, for every pound given as a donation, we issue a token - think of it as a ‘cryptopound’ - that represents it exactly on the blockchain. That way charities and donors are safe in the knowledge that the value of donations stays the same over time.'
      },
      {
        question: 'What happens to my money in between the time I make a donation, and when it’s actually received by the charity? How do I know it’s safe?',
        answer: 'We keep your money safe by putting it in a segregated account until it’s received by the charity (or refunded to you if no goals are achieved). That means there is a clear separation between Alice’s funds and the donations made to a project. We don’t have access to it, and it will still be safe even if Alice ever closes down.'
      },
      {
        question: 'If everything is public and transparent on the blockchain, does that mean my personal data is on there as well? Can everyone see my name and how much I’ve donated?',
        answer: 'We take data protection very seriously, so no personal information is stored on the blockchain. Our smart contracts track how much was donated, which goals have been validated, and how much the charity has received for each project. They also timestamp every event so that you’ll know when everything occurred. But they don’t track information about who gave each donation.'
      },
      {
        question: 'Do you sell to, or share my data with charities? How do I know my personal information is safe?',
        answer: 'We invest significant resources to protect your personal information. Alice does not sell your data to charities, or to any other third party. We will ask you for your explicit consent to allow the charities you donate to, and/or Alice, to contact you about other campaigns and appeals. For more information, please read our <span class="question-link"><a href="https://s3.eu-west-2.amazonaws.com/alice-res/privacy_policy.pdf" target="_blank">privacy policy</a></span>.'
      },
      {
        question: 'Why can’t I see exactly who my donation is helping, or the proof that the goals have been achieved?',
        answer: 'For data protection reasons, and because many of the people being supported by projects on Alice are vulnerable, charities can’t tell you exactly who is being supported by any given project. They’ll often give you a good idea of the type of people they’re helping though, so you have as much information about your donation as possible.'
      },
      {
        question: 'If you’re using a blockchain, can I donate in Bitcoin, Ether or any other cryptocurrency?',
        answer: 'Not for the moment. There are several reasons for this: firstly, charities can’t afford to have the value of donations fluctuate as it could put their projects at risk. Secondly, we wanted to give the benefits of charity transparency to as many people as possible right from the start.'
      },
      {
        question: 'How do Alice’s fees work?',
        answer: 'Currently, Alice takes a 3% fee from each donation paid to charity projects. That means we only get paid when projects are successful. In return we help charities raise more money, more transparently. In time, we hope to phase out this fee, so that the charities can receive all donations made.'
      }
    ];

    return vm;
  }]);
