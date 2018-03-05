let Registry = artifacts.require('./mock/RegistryMock')
let RegistryStorage = artifacts.require('./mock/RegistryStorageMock')

let registry // test subject
let storage // test subject's initialized abstract storage impl

contract('Registry', function(accounts) {

  it('should test with sanity', async () => {
    accounts.length.should.be.gt(1)
  })

  beforeEach(async () => {
    storage = await RegistryStorage.new()
    registry = await Registry.new(storage.address, { gas: 4845075 })
  })

  describe('initialization', async () => {
    it('sets the registry moderator to the contract creator', async () => {
      let moderatorAddr = await registry.moderator()
      moderatorAddr.should.be.equal(accounts[0])
    })

    it('references an abstract storage contract impl', async () => {
      let storageAddr = await registry.abstract_storage()
      storageAddr.should.be.equal(storage.address)
    })
  })

  describe('#changeMod', async () => {  
    context('when the caller is not the acting registry moderator', async () => {
      beforeEach(async () => {
        await registry.changeMod(accounts[0], { from: accounts[accounts.length - 1] }).should.be.rejectedWith(exports.EVM_ERR_REVERT);
      })

      it('should not have allowed unauthorized modification to the moderator', async () => {
        let moderatorAddr = await registry.moderator()
        moderatorAddr.should.be.equal(accounts[0])
      })
    })

    context('when the caller is the acting registry moderator', async () => {
      let initialModeratorAddr
      beforeEach(async () => {
        initialModeratorAddr = await registry.moderator()
      })

      beforeEach(async () => {
        await registry.changeMod(accounts[accounts.length - 1])
      })

      it('should have changed the acting registry moderator', async () => {
        let moderatorAddr = await registry.moderator()
        moderatorAddr.should.be.equal(accounts[accounts.length - 1])
        moderatorAddr.should.not.be.equal(initialModeratorAddr)
      })
    })
  })

  describe('#changeStorage', async () => {
    context('when the caller is not the acting registry moderator', async () => {
      beforeEach(async () => {
        await registry.changeStorage(accounts[0], { from: accounts[accounts.length - 1] }).should.be.rejectedWith(exports.EVM_ERR_REVERT);
      })

      it('should not have allowed unauthorized modification to the abstract storage impl', async () => {
        let storageAddr = await registry.abstract_storage()
        storageAddr.should.be.equal(storage.address)
      })
    })

    context('when the caller is the acting registry moderator', async () => {
      beforeEach(async () => {
        await registry.changeStorage(accounts[accounts.length - 1])
      })

      it('should have changed the abstract storage impl address', async () => {
        let storageAddr = await registry.abstract_storage()
        storageAddr.should.be.equal(accounts[accounts.length - 1])
        storageAddr.should.not.be.equal(storage.address)
      })
    })
  })

  describe('#registerApp', async () => {
    let appStorage
    let descStorage

    context('when the caller is the acting registry moderator', async () => {
      beforeEach(async () => {
        await registry.registerApp.call('prvd inbound oracle', 'turnkey smart contract oracle for storing and verifying real-world data on-chain').then(async (response) => {
          appStorage = response[0]
          descStorage = response[1]
        })
      })

      it('should return the namespaced app storage location', async () => {
        appStorage.should.not.be.eq(null)
      })

      it('should return the namespaced app description storage location', async () => {
        descStorage.should.not.be.eq(null)
      })
    })
  })

  describe('#getAppInfo', async () => {
    let appInfo

    beforeEach(async () => {
      await registry.registerApp('prvd inbound oracle', 'turnkey smart contract oracle for storing and verifying real-world data on-chain')
    })

    context('when the requested app has been registered', async () => {
      beforeEach(async () => {
        appInfo = await registry.getAppInfo('prvd inbound oracle')
      })

      it('should successfully find and return the requested app', async () => {
        appInfo.should.not.be.eq(null)
        appInfo.length.should.be.eq(5)
      })

      it('should return the true storage location for the app in slot 0', async () => {
        let trueLocation = appInfo[0]
        trueLocation.should.not.be.eq(null)
      })

      it('should return the app description in slot 1', async () => {
        let description = appInfo[1]
        description.should.not.be.eq(null)
        web3.toUtf8(description).should.be.deep.eq('turnkey smart contract oracle for storing and verifying real-world data on-chain')
      })

      it('should return the app name in slot 2', async () => {
        let app = appInfo[2]
        app.should.not.be.eq(null)
        web3.toUtf8(app).should.be.deep.eq('prvd inbound oracle')
      })

      it('should return the length in bytes of the app description in slot 3', async () => {
        let len = appInfo[3]
        len.should.not.be.eq(null)
        web3.toDecimal(len).should.eq('turnkey smart contract oracle for storing and verifying real-world data on-chain'.length)
      })

      it('should return the number of app versions available in slot 4', async () => {
        let numVersions = appInfo[4]
        numVersions.should.not.be.eq(null)
        numVersions.toNumber(10).should.be.eq(0)
      })
    })
  })

  describe('#registerVersion', async () => {
    let verStorage
    let descStorage
  
    beforeEach(async () => {
      await registry.registerApp('prvd', '...')
      await registry.registerVersion.call('prvd', '0.0.1', 'Pre-alpha').then(async (response) => {
        verStorage = response[0]
        descStorage = response[1]
      })
    })
  
    it('should return the app-namespaced version storage location', async () => {
      verStorage.should.not.be.eq(null)
    })

    it('should return the app-namespaced version description storage location', async () => {
      descStorage.should.not.be.eq(null)
    })
  })

  describe('#addVersionFunctions', async () => {
    // ...
  })

  describe('#getVerInfo', async () => {
    let verInfo

    beforeEach(async () => {
      await registry.registerApp('prvd', '...')
      await registry.registerVersion('prvd', '0.0.1', 'Pre-alpha').then(async (response) => {
        verStorage = response[0]
        descStorage = response[1]
      })
    })

    context('when the requested app version has been registered', async () => {
      beforeEach(async () => {
        verInfo = await registry.getVerInfo('prvd', '0.0.1')
      })

      it('should return the true storage location for the app version in slot 0', async () => {
        let trueLocation = verInfo[0]
        trueLocation.should.not.be.eq(null)
      })

      it('should return the version description in slot 1', async () => {
        let description = verInfo[1]
        description.should.not.be.eq(null)
        web3.toUtf8(description).should.be.deep.eq('Pre-alpha')
      })

      it('should return the version name in slot 2', async () => {
        let version = verInfo[2]
        version.should.not.be.eq(null)
        web3.toUtf8(version).should.be.deep.eq('0.0.1')
      })
  
      it('should return the length in bytes of the version description in slot 3', async () => {
        let len = verInfo[3]
        len.should.not.be.eq(null)
        web3.toDecimal(len).should.be.deep.eq('Pre-alpha'.length)
      })

      it('should return the initialization status of the version in slot 4', async () => {
        let initialized = verInfo[4]
        initialized.should.not.be.eq(null)
        web3.toDecimal(initialized).should.eq(0)
      })

      it('should return the index of the version in the app version list in slot 5', async () => {
        let idx = verInfo[5]
        idx.should.not.be.eq(null)
        web3.toDecimal(idx).should.eq(0)
      })

      it('should return the number of functions for the version in slot 6', async () => {
        let numFuncs = verInfo[6]
        numFuncs.should.not.be.eq(null)
        web3.toDecimal(numFuncs).should.eq(0)
      })
  
      it('should return the true storage location of the version function list in slot 7', async () => {
        let trueLocation = verInfo[7]
        trueLocation.should.not.be.eq(null)
      })
    })
  })

  describe('#getFuncInfo', async () => {
    // ...
  })
})
