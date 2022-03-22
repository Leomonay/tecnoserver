const Plant = require('../models/Plant');
const User = require ('../models/User');
const bcrypt = require ('bcrypt');
const jwt = require ('jsonwebtoken')
const UserOptions = require('../models/UserOptions')

async function setPassword(string){
    const ronda = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(string, ronda)
    return hash
}

async function addUser (req,res){
    try{
        const {username, name, idNumber, charge, password, email, phone, plantName, access, plant}=req.body;
        const checkUser = await User.find({username:username}).lean().exec()
        if(checkUser.length>0){
            res.status(400).send({message: 'El usuario ya existe'})
        }else{
            const newUser={name,idNumber, email,phone}
            newUser.username=username || email.split('@')[0];
            newUser.plant = await Plant.findOne({name: plantName? plantName: plant})
            newUser.active = true
            newUser.access  = access || 'Client'
            
            //hashing password
            if(password)newUser.password = await setPassword(password)

            if(charge)newUser.charge=charge
            const newItem = await User(newUser)
            const itemStored = await newItem.save()
            res.status(200).send({user: itemStored})
        }
    }catch (e){
        res.status(500).send({error: e.message})
    }
}

async function login(req,res){
    console.log('req.body', req.body)
    try{
        const {username, password} = req.body
        const user = await User.findOne({username : username}).populate('plant')
        const tokenInput = {user: username, access: user.access, id:user.idNumber}
        if(user.plant) tokenInput.plant = user.plant.name
        if(await bcrypt.compare(password, user.password)){
            const accessToken = generateAccessToken(tokenInput);
            res.status(200).send({
                access: user.access,
                plant: user.plant?user.plant.name:undefined,
                token: accessToken
            })
        }else{
            res.status(400).send({error: 'Nombre de usuario o contraseña incorrecta'})
        }
    }catch(e){
        res.status(400).send({error: e.message})
    }
}

async function getUserData(req,res){
    try{
        const token = req.headers.authorization.split(' ')[1]
        jwt.verify(token, process.env.SECRET_KEY, (err,user)=>{
            if(err){
                console.log("ERROR", err.message)
                res.status(400).send({error: 'Access denied: Token expired or incorrect'})
            }else{
                res.status(200).send(user)
            }
        })
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
}

function generateAccessToken(user){
    return jwt.sign(user, process.env.SECRET_KEY);
}

function validateToken(req,res,next){
    try{
        const accessToken = req.headers['authorization']
        if (!accesToken) res.send('Access Denied')
        jwt.verify(accessToken, process.env.SECRET_KEY, (err,user)=>{
            if(err){
                res.send('Access denied: Token expired or incorrect')
            }else{
                next()
            }
        })
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
}

async function updateUser(req, res){
    try{
        const {idNumber} = req.params
        const update = req.body
        if (update.password) update.password = await setPassword(update.password)
        if (update.plantName) update.plantName = await Plant.findOne({name: plantName})
        await User.findOneAndUpdate({idNumber}, update)
        res.status(200).send({success: 'Actualización exitosa'})
    }catch(e){
        res.status(400).send({error:e.message})
    }
}

async function getUsersList(req, res){
    try{
        const {access,charge,id,plant} = req.query
        const filters = {access,charge,id,plant}
        if (!req.query.active) filters.active=true
        for (let key of Object.keys(filters)) if (!filters[key]) delete filters[key]
        const users = await User.find(filters)
        res.status(200).send(users.map(user=>({
            id: user.idNumber,
            name: user.name,
            access: user.access,
            charge: user.charge,
            active: user.active,
            imgURL: user.imgURL,
        })))
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
}
async function getUserOptions(req, res){
    try{
        const options = await UserOptions.findOne()
        res.status(200).send(options)
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
}

async function filterUser(req, res){
    try{
        const {filters} = req.body
        if(filters.plant){
            const plantId = (await Plant.findOne({name: filters.plant}))._id
            if (plantId) filters.plant = plantId
        }
        const users = await User.find(filters).populate('plant')
        res.status(200).send(users)
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
}

module.exports={
    addUser,
    login,
    getUserData,
    updateUser,
    getUsersList,
    getUserOptions,
    filterUser,
    setPassword
}