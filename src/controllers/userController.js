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
async function getWorkers(req,res){
    try{
        const workers = await User.find({access:'Worker'})
        .select(['idNumber', 'name', 'charge'])
        res.status(200).send(workers.map(e=>{return{idNumber:e.idNumber, name:e.name, charge:e.charge}}))
    }catch(e){
        console.log(e.message)
        res.status(500).send({error: e.message})
    }
}

async function getSupervisors(req,res){
    try{
        const supervisors = await User.find({access:'Supervisor'})
        .select(['idNumber', 'name', 'charge'])
        res.status(200).send(supervisors.map(e=>{return{idNumber:e.idNumber, name:e.name, charge:e.charge}}))
    }catch(e){
        console.log(e.message)
        res.status(500).send({error: e.message})
    }
}

async function login(req,res){
    // try{
            const {username, password} = req.body
            const user = await User.findOne({username : username}).populate('plant')
            const tokenInput = {user: username, access: user.access}
            if(user.plant) tokenInput.plant = user.plant.name
            console.log('compare', await bcrypt.compare(password, user.password))
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
    // }catch(e){
    //     res.status(400).send({error: e.message})
    // }
}

async function getUserData(req,res){
    const token = req.headers.authorization.split(' ')[1]
    jwt.verify(token, process.env.SECRET_KEY, (err,user)=>{
        if(err){
            console.log("ERROR", err.message)
            res.status(400).send({error: 'Access denied: Token expired or incorrect'})
        }else{
            res.status(200).send(user)
        }
    })
}

function generateAccessToken(user){
    return jwt.sign(user, process.env.SECRET_KEY,
        // {expiresIn: '5m'}
        );
}

function validateToken(req,res,next){
    const accessToken = req.headers['authorization']
    if (!accesToken) res.send('Access Denied')
    jwt.verify(accessToken, process.env.SECRET_KEY, (err,user)=>{
        if(err){
            res.send('Access denied: Token expired or incorrect')
        }else{
            next()
        }
    })
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
    const users = await User.find({})
    res.status(200).send(users)
}
async function getUserOptions(req, res){
    const options = await UserOptions.findOne()
    res.status(200).send(options)
}
async function filterUser(req, res){
    const {filters} = req.body
    if(filters.plant){
        const plantId = (await Plant.findOne({name: filters.plant}))._id
        if (plantId) filters.plant = plantId
    }
    const users = await User.find(filters).populate('plant')
    res.status(200).send(users)
}

module.exports={
    addUser,
    getWorkers,
    login,
    getUserData,
    updateUser,
    getUsersList,
    getSupervisors,
    getUserOptions,
    filterUser
}