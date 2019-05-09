const EthProxy = require('../gateways/ethProxy');
const MailUtils = require('../utils/mail-utils');

class BasicJob {
  constructor(name) {
    this.name = name;
    this.id = `${this.name.toLowerCase()}_job_${Date.now()}`;
  }

  async execute() {
    this.log('started');
    try {
      await this.run();
      this.log('finished successfully');
    } catch (err) {
      await this.error('running the job failed', err);
    }
  }

  /**
   * Performs the action.
   * @return {Promise}
   */
  async run() {
    throw new Error(
      'BasicJob.run() must be overriden with the actual job logic');
  }

  log(msg) {
    console.log(`${this.id}: ${msg}`);
  }

  async error(msg, cause, context) {
    context = Object.assign({job: this.id, msg}, context);
    await MailUtils.sendErrorNotification('jobError', context, cause);
    this.log(`Error: ${msg}, caused by ${cause.toString()}\n${cause.stack}`);
  }
}

class ModelJob extends BasicJob {
  constructor(name, model, readyStatus) {
    super(name);
    this.model = model;
    this.readyStatus = readyStatus;
  }

  async execute() {
    this.log('started');

    let target;
    try {
      target = await this.findReady();
    } catch (err) {
      await this.error('could not retrieve target', err);
      return;
    }
    if (!target) {
      this.log('no targets found, skipping');
      return;
    }

    this.log(`target was found: processing ${target._id}`);
    try {
      await this.run(target);
      await this.saveAndUpdateStatus(target, this.completedStatus());
    } catch (err) {
      await this.error('running the job failed', err, target);
    }
  }

  // This method can be overriden if more complex behavior is desired.
  async findReady() {
    return await this.model.findOneAndUpdate(
      {status: this.readyStatus},
      {status: this.startedStatus()},
      {sort: '_id'});
  }

  /**
   * Performs the action.
   * @param target - instance of model that should be processed
   * @return {Promise}
   */
  // eslint-disable-next-line no-unused-vars
  async run(target) {
    throw new Error(
      'ModelJob.run() must be overriden with the actual job logic');
  }

  async saveAndUpdateStatus(target, newStatus) {
    this.log(`changing status to: ${newStatus}`);
    target.status = newStatus;
    await target.save();
  }

  async error(msg, cause, target) {
    super.error(msg, cause, { target });
    if (target) {
      await this.saveAndUpdateStatus(target, this.errorStatus());
    }
  }

  startedStatus()    { return `${this.name}_STARTED`; }
  inProgressStatus() { return `${this.name}_IN_PROGRESS`; }
  errorStatus()      { return `${this.name}_ERROR`; }
  completedStatus()  { return `${this.name}_COMPLETED`; }
  resolvedStatus()   { return `${this.name}_REVERTED`; }
  lostStatus()       { return `${this.name}_LOST`; }
}

const MAX_IN_PROGRESS_TXS = 5;
const CHECK_TX_INTERVAL_MS = 5000;
const MIN_AGE_FOR_ETHERSCAN_CHECKING_MS = 300000;

class BlockchainJob extends ModelJob {
  async execute() {
    this.log('started');
    let inProgressCount = await this.countInProgress();

    this.tryCheck();
    if (inProgressCount <= MAX_IN_PROGRESS_TXS) {
      this.trySend();
    }
  }

  async trySend() {
    this.log('trying to find a ready target');
    let target;
    try {
      target = await this.findReady();
    } catch (err) {
      await this.error('could not retrieve ready target', err);
    }
    if (target) {
      await this.executeTransaction(target);
    } else {
      this.log('no ready targets found, skipping');
    }
  }

  async tryCheck() {
    this.log('trying to find "in progress" target');
    let target;
    try {
      target = await this.findInProgress();
    } catch (err) {
      await this.error('could not retrieve "in progress" target', err);
    }
    if (target) {
      await this.executeChecker(target);
    } else {
      this.log('no "in progress" targets found, skipping');
    }
  }

  async executeTransaction(target) {
    this.log(`target was found: processing ${target._id}`);
    try {
      let tx = await this.run(target);
      if (!tx) throw new Error('job did not return a transaction');
      this.log(`transaction ${tx} was sent`);

      target[this.txFieldName()] = tx;
      target[this.timeFieldName()] = Date.now();
      await this.saveAndUpdateStatus(target, this.inProgressStatus());
    } catch (err) {
      await this.error('running the job failed', err, target);
    }
  }

  async executeChecker(target) {
    this.log(`checking transaction status for target ${target._id}`);
    let tx = target[this.txFieldName()];

    try {
      if (!tx) {
        throw new Error(
          `target ${target._id} has "in progress" status, but no tx field`);
      }
      await this.checkTransaction(target, tx);
    } catch (err) {
      await this.error('checking transaction failed', err, target);
    }

    try {
      if (target.status === this.completedStatus()) {
        await this.postConfirmation(target, tx);
      }
    } catch (err) {
      await this.error('running post-transaction hooks failed', err, target);
    }
  }

  async countInProgress() {
    return await this.model.count({ status: this.inProgressStatus() });
  }

  async findInProgress() {
    return await this.model.findOne(
      {status: this.inProgressStatus()},
      null,
      {sort: '_id'});
  }

  /**
   * A hook for subclasses if they need to do anything after confirmation.
   */
  // eslint-disable-next-line no-unused-vars
  async postConfirmation(target, tx) { }

  async checkTransaction(target, tx) {
    this.log('checking if transaction was processed...');

    let receipt = await EthProxy.checkTransaction(tx);
    if (receipt) {
      if (EthProxy.checkTransactionReceipt(receipt)) {
        await this.saveAndUpdateStatus(target, this.completedStatus());
        this.log('transaction was completed');
      } else {
        await this.saveAndUpdateStatus(target, this.revertedStatus());
        this.log('transaction was reverted');
      }
      return;
    }

    let age = Date.now() - target[this.timeFieldName()];
    if (age >= MIN_AGE_FOR_ETHERSCAN_CHECKING_MS) {
      if (!EthProxy.checkTransactionWithEtherscan(tx)) {
        await this.saveAndUpdateStatus(target, this.lostStatus());
        this.log('no trace of transaction on Etherscan');
        return;
      }
    }
  }

  timeFieldName() { return `${this.name.toLowerCase()}Time`; }
  txFieldName() { return `${this.name.toLowerCase()}Tx`; }
}

module.exports = {
  BasicJob,
  BlockchainJob,
  ModelJob,
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
