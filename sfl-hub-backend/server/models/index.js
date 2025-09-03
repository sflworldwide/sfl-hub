import { Sequelize } from 'sequelize'; 
import createSequelizeInstance from '../config/dbConnection.js';  

import { UserModel } from './User.js'; 
const db = {};

const initDB = async () => {
    if (db.sequelize) {
        console.log("Database already initialized.");
        return db;
    }
    try {
        const sequelize = await createSequelizeInstance();

        db.sequelize = sequelize;
        db.Sequelize = Sequelize;
        db.User = UserModel(sequelize);  

        console.log("All models initialized successfully.");
        return db;
    } catch (error) {
        console.error("Failed to initialize database and models:", error);
        throw error;
    }
};

export { initDB, db };
