const TestUtils = require('../test-utils');
const Utils = TestUtils.loadModuleFromDevServer('service/utils');
const Mango = TestUtils.loadModuleFromDevServer('service/mango');
const Project = Utils.loadModel('project');
const Outcome = Utils.loadModel('outcome');
const Charity = Utils.loadModel('charity');

// TODO we could create more tests for getProject EP - to test bad responses
// Currently we also have no tests for getOutcome - beacause this EP is unused in alice-web

describe('ProjectController', function () {
    let objects;

    TestUtils.setBeforeAndAfterHooksForControllerTest({
        name: 'project'
    });
    

    it('Should get no projects', function () {
        return TestUtils.testGet('getProjectsForAdmin', '', function (res) {
            res.length.should.be.equal(0);
        });
    });

    it('Should create test data', async function () {
        objects = await TestUtils.createTestObjects();
    });

    it('Should get 2 projects', function () {
        return TestUtils.testGet('getProjectsForAdmin', '', function (res) {
            res.length.should.be.equal(2);
        });
    });

    it('Should create pilot project and get it', async function () {
        let pilot = await new Project({
            code: 'mungos-15-lives',
            title: 'TestPilotTitle'
        }).save();

        await TestUtils.testGet('getPilotProject', '', function (res) {
            res._id.should.be.equal(pilot._id.toString());
        })
    });

    it('Should get project details', function () {
        return TestUtils.testGet('projects', objects.projects[0].code, function (res) {
            res._outcomes.length.should.be.equal(1);
            res._id.should.be.equal(objects.projects[0]._id.toString());
            res.raised.should.be.equal(150);
            res.needed.should.be.equal(850);
        });
    });

    it('Should get supporters', function () {
        return TestUtils.testGet('getSupporters', objects.projects[0]._id, function (res) {
            res.length.should.be.equal(2);
        });
    });

    it('Should prepare data for project saving', async function () {
        // Updating mango wallet for charity connected to project
        let charity = objects.charity;
        const charityAdmin = objects.users[0];
        charityAdmin.birthday = Mango.convertBirthday(charityAdmin.dateOfBirth);
        const mangoUserId = await Mango.registerCharity(charity.name, charityAdmin);
        charity.mangoUserId = mangoUserId;
        await new Charity(charity).save();

        // Preparing project with outcomes object
        objects.project =
            (await Project
                .findById(objects.projects[0]._id)
                .populate('_outcomes')
            ).toObject();
        objects.project.outcomes = objects.project._outcomes;
    });

    it('Should save project with outcomes - no changes', async function () {
        await TestUtils.testPost(
            'saveProjectWithOutcomes',
            objects.project,
            async function (res) {
                res._id.should.be.equal(objects.project._id.toString());
                res._outcomes.length.should.be.equal(1);
            });
    });

    it('Should save project with outcomes - outcome added', async function () {
        objects.project.outcomes.push({
            title: 'Title',
            description: 'Description',
            amount: 0
        });
        await TestUtils.testPost(
            'saveProjectWithOutcomes',
            objects.project,
            async function (res) {
                res._id.should.be.equal(objects.project._id.toString());
                res._outcomes.length.should.be.equal(2);
            });
    });

    it('Should save project with outcomes - outcome removed', async function () {
        objects.project.outcomes.shift();
        await TestUtils.testPost(
            'saveProjectWithOutcomes',
            objects.project,
            async function (res) {
                res._id.should.be.equal(objects.project._id.toString());
                res._outcomes.length.should.be.equal(1);
            });
    });

    it('Should save project with outcomes - new project with new outcomes', async function () {
        const projectWithOutcomes = {
            code: 'Code',
            title: 'Title',
            fundingTarget: 100,
            charity: objects.charity._id,
            outcomes: [
                {
                    title: 'Outcome Title 1',
                    description: 'Outcome Description 1',
                    amount: 0
                },
                {
                    title: 'Outcome Title 2',
                    description: 'Outcome Description 2',
                    amount: 0
                },
            ]
        };
        await TestUtils.testPost(
            'saveProjectWithOutcomes',
            projectWithOutcomes,
            async function (res) {
                res._outcomes.length.should.be.equal(2);
                // TODO add deep equal test
                res.title.should.be.equal(projectWithOutcomes.title);
            });
    });

    it('Should remove project with outcomes', async function () {
        let projects, outcomes;
        projects = await Project.find({});
        outcomes = await Outcome.find({_projectId: objects.projects[0]._id});
        const projectsNumber = projects.length;

        await TestUtils.testPost('removeProjectWithOutcomes', {_id: objects.projects[0]._id}, async function (res) {
            console.log(res);

            projects = await Project.find({});
            outcomes = await Outcome.find({_projectId: objects.projects[0]._id});

            projects.length.should.be.equal(projectsNumber - 1);
            outcomes.length.should.be.equal(0);

        });
    });
});
