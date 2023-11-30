const usermodel = require('../model/usermodel');
const fs = require('fs');
const canvas = require('canvas');
const faceApi = require('face-api.js');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const { exec } = require('node:child_process');


class User {
    async createUser(req, res) {
        try {
            const { username, password } = req.body;
            const usernameDb = await usermodel.findOne({ username: username });
            console.log(usernameDb)
            if (usernameDb) {
                return res.status(400).json({ message: "username already exists" })
            }
            const image1 = req.file.path;
            const faceID = Math.random().toString(36).substring(7)
            const img1 = await canvas.loadImage(image1)
            // label face
            const results = await faceApi.detectAllFaces(img1).withFaceLandmarks().withFaceDescriptors()
            let labeledFaceDescriptors1 = results.map(fd => new faceApi.LabeledFaceDescriptors(`${faceID
                }`, [fd.descriptor]))
            //fs.writeFileSync('./labeledFaceDescriptors.json', JSON.stringify(labeledFaceDescriptors))
            const file = fs.readFileSync('./labeledFaceDescriptors.json');

            if (file) {
                let labeledFaceDescriptors
                if (file.length === 0) {
                    labeledFaceDescriptors = [];
                } else {
                    labeledFaceDescriptors = JSON.parse(file);
                }
                // let labeledFaceDescriptors = [];
                // add id element to object labeledFaceDescriptors1[0]
                labeledFaceDescriptors1[0].id = Math.random().toString(36).substring(7);
                labeledFaceDescriptors.push(labeledFaceDescriptors1[0])
                // add element id to array labeledFaceDescriptors1
                for (let i = 0; i < labeledFaceDescriptors1.length; i++) {
                    labeledFaceDescriptors1[i].id = Math.random().toString(36).substring(7);
                }
                fs.writeFileSync('./labeledFaceDescriptors.json', JSON.stringify(labeledFaceDescriptors))
            } else {
                const labeledFaceDescriptors = [];
                labeledFaceDescriptors.push({ label: "label", descriptors: [singleResult.descriptor] })
                fs.writeFileSync('./labeledFaceDescriptors.json', JSON.stringify(labeledFaceDescriptors))
            }
            // save to mongodbs
            const newUser = new usermodel({
                username: username,
                // hash password
                password: bcryptjs.hashSync(password, 10),
                faceID: faceID
            })
            newUser.save();
            // jwt sign key
            const returnUser = {
                username: username,
                faceID: faceID
            }
            // delete this picture after saves
            exec(`rm ${image1}`)
            return res.status(200).json({ returnUser })
        } catch (e) {
            console.log(e)
        }
    }
}
module.exports = new User();