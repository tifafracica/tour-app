const express = require('express');
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto } = require('./../controllers/userController');

const { signUp,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protectAccess,
  restrictAccess,
  logout } = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', signUp)
router.post('/login', login)
router.get('/logout', logout)
router.post('/forgot_password', forgotPassword)
router.patch('/reset_password/:token', resetPassword);

router.use(protectAccess);

router.patch('/update_my_password', updatePassword);
router.patch('/update_me',
  uploadUserPhoto,
  resizeUserPhoto, 
  updateMe);
router.delete('/delete_me', deleteMe);

router.get('/me', getMe, getUser)

router.use(restrictAccess('admin'));

router
  .route('/')
  .get(getAllUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);


module.exports = router;