const TestUtils = require('../test-utils');
const Utils = TestUtils.loadModuleFromDevServer('service/utils');
const Category = Utils.loadModel('category');

// Currently we have not tests for EPs: contact, getAWSPostData
describe('UtilsController', function () {
    TestUtils.setBeforeAndAfterHooksForControllerTest({
        name: 'utils'
    });

    const categoryToCreate = {
        title: 'testTitle',
        img: 'testImgUrl'
    };
    let category;

    it('Should create test objects', async function () {
        category = await new Category(categoryToCreate).save();
    });

    it('Should get categories', function () {
        return TestUtils.testGet('getCategories', '', async function (res) {
            res.length.should.be.equal(1);
            res[0].should.be.shallowDeepEqual(categoryToCreate);
        });
    });
});