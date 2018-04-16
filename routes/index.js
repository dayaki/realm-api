import express from 'express';
import config from '../config/database';
import middleware from '../middleware';

import initializeDb from '../db';

let router = express();

initializeDb(db => {
  
})