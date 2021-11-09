const multer = require ('multer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './src/storage/imgs')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now()
      //cb(null, `${file.fieldname}-${uniqueSuffix}.png`)
      cb(null, `${req.body.name}-${uniqueSuffix}.png`)
    }
  })
  
  const upload = multer({ storage })

  module.exports=upload