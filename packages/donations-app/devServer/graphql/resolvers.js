const Utils = require('../service/utils');
const Project = Utils.loadModel('project');
const Donation = Utils.loadModel('donation');
const Outcome = Utils.loadModel('outcome');

async function getProjects(filters) {
  return await Project.aggregate([
    { $match: filters },
    { $lookup: {
        from: "outcomes",
        let: { projectId: "$_id" },
        pipeline: [
          { $match: { $expr:
            { $eq: [ "$_projectId", "$$projectId" ] } }
          },
          {
            $project: {
              "_id": 1,
              "title": 1,
              "description": 1,
              "costPerUnit": 1 }
          }
        ],
        as: "_outcomes" }
    },
    { $lookup: {
        from: "charities",
        localField: "charity",
        foreignField: "_id",
        as: "charity" }
    },
    { $unwind: "$charity" },
    { $project: {
        "charity": "$charity.name",
        "code": 1,
        "title": 1,
        "_outcomes": 1,
        "validator": 1,
        "status": 1 }
    },
  ]);
}

module.exports = {
  Query: {
    async allProjects() {
      return await getProjects({});
    },
    async getProject(root, { code }) {
      let projects = await getProjects({ code });
      if (projects.length == 0) {
        return null;
      } else {
        return projects[0];
      }
    },
    async getDonations(root, { projectCode }) {
      let project = await Project.findOne({ code: projectCode });
      if (!project) {
        return [];
      } else {
        let donations = await Donation.find({ _projectId: project._id });
        return donations;
      }
    }
  }
};
