import { Router } from 'express';
import UsersController from '../controllers/UsersController';

const router = Router();

router.post('/users', (req, res) => UsersController.postNew(req, res));

module.exports = router;
