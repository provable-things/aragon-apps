const { assertBn } = require('../helpers/assert/assertBn')
const { assertEvent } = require('../helpers/assert/assertEvent')
const { assertRevert } = require('../helpers/assert/assertThrow')
const { decodeEventsOfType } = require('../helpers/lib/decodeEvent')
const { AGREEMENT_EVENTS } = require('../helpers/utils/events')
const { ARAGON_OS_ERRORS, AGREEMENT_ERRORS } = require('../helpers/utils/errors')

const deployer = require('../helpers/utils/deployer')(web3, artifacts)

contract('Agreement', ([_, EOA]) => {
  let arbitrator, aragonAppFeesCashier, stakingFactory, agreement

  const title = 'Sample Agreement'
  const content = '0xabcd'

  before('deploy instances', async () => {
    arbitrator = await deployer.deployArbitrator()
    aragonAppFeesCashier = await deployer.deployAragonAppFeesCashier()
    stakingFactory = await deployer.deployStakingFactory()
    agreement = await deployer.deploy()
  })

  describe('initialize', () => {
    it('cannot initialize the base app', async () => {
      const base = deployer.base

      assert(await base.isPetrified(), 'base agreement contract should be petrified')
      await assertRevert(base.initialize(title, content, arbitrator.address, aragonAppFeesCashier.address, stakingFactory.address), ARAGON_OS_ERRORS.ERROR_ALREADY_INITIALIZED)
    })

    context('when the initialization fails', () => {
      it('fails when using a non-contract arbitrator', async () => {
        const court = EOA

        await assertRevert(agreement.initialize(title, content, court, aragonAppFeesCashier.address, stakingFactory.address), AGREEMENT_ERRORS.ERROR_ARBITRATOR_NOT_CONTRACT)
      })

      it('fails when using a non-contract aragon app fees cashier', async () => {
        const cashier = EOA

        await assertRevert(agreement.initialize(title, content, arbitrator.address, cashier, stakingFactory.address), AGREEMENT_ERRORS.ERROR_APP_FEE_CASHIER_NOT_CONTRACT)
      })

      it('fails when using a non-contract staking factory', async () => {
        const factory = EOA

        await assertRevert(agreement.initialize(title, content, arbitrator.address, aragonAppFeesCashier.address, factory), AGREEMENT_ERRORS.ERROR_STAKING_FACTORY_NOT_CONTRACT)
      })
    })

    context('when the initialization succeeds', () => {
      let receipt

      before('initialize agreement DAO', async () => {
        receipt = await agreement.initialize(title, content, arbitrator.address, aragonAppFeesCashier.address, stakingFactory.address)
      })

      it('cannot be initialized again', async () => {
        await assertRevert(agreement.initialize(title, content, arbitrator.address, aragonAppFeesCashier.address, stakingFactory.address), ARAGON_OS_ERRORS.ERROR_ALREADY_INITIALIZED)
      })

      it('initializes the first setting', async () => {
        const currentSettingId = await agreement.getCurrentSettingId()

        assertBn(currentSettingId, 1, 'current content ID does not match')

        const logs = decodeEventsOfType(receipt, deployer.abi, AGREEMENT_EVENTS.SETTING_CHANGED)
        assertEvent({ logs }, AGREEMENT_EVENTS.SETTING_CHANGED, { settingId: currentSettingId })
      })

      it('initializes the first setting with the given title, content, arbitrator and app fees cashier', async () => {
        const setting = await agreement.getSetting(1)

        assert.equal(setting.title, title, 'title does not match')
        assert.equal(setting.content, content, 'content does not match')
        assert.equal(setting.arbitrator, arbitrator.address, 'arbitrator does not match')
        assert.equal(setting.aragonAppFeesCashier, aragonAppFeesCashier.address, 'aragon app fees cashier does not match')
      })
    })
  })
})
