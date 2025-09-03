import { Sequelize } from 'sequelize';
import createSequelizeInstance from '../config/dbConnection.js'; 

const getcountry = async (userId) => {
  try {
    const sequelize = await createSequelizeInstance();  
    // console.log("here = ",userId);
    

    const result = await sequelize.query('SELECT * FROM spgetcountrydata()', {
      replacements: { userId }, 
      type: Sequelize.QueryTypes.RAW,  
    });

    return result;  
  } catch (error) {
    console.error('Error calling stored procedure:', error);
    throw error;
  }
};


const getStateListbycountry = async (userId) => {
    try {
      const sequelize = await createSequelizeInstance();  
      // console.log("here = ",userId);
      const comparePass = `select * from spreturnstates(:p_countryID);`;
      const resultPass = await sequelize.query(comparePass, {
        replacements: { p_countryID: userId.CountryID},
        type: Sequelize.QueryTypes.RAW,
      });  
      return resultPass;  
    } catch (error) {
      console.error('Error calling stored procedure:', error);
      throw error;
    }
  };

const getpostadatabyCountry = async (userId) => {
    try {
      const sequelize = await createSequelizeInstance();  
      // console.log("here = ",userId);
      const comparePass = `SELECT * FROM spgetpostaldatabycountry(:p_countryID,:p_postaCode);`;
      const resultPass = await sequelize.query(comparePass, {
        replacements: { p_countryID: userId.CountryID,p_postaCode: userId.PostalCode},
        type: Sequelize.QueryTypes.RAW,
      });  
      return resultPass;  
    } catch (error) {
      console.error('Error calling stored procedure:', error);
      throw error;
    }
  };

const getCityListByCountry = async(countryid, Citytype) => {
  try{
    const sequelize = await createSequelizeInstance();
    const comparePass = `select * from spgetcitylistbycountryid(:countryid,:Citytype)`;
    const resultPass = await sequelize.query(comparePass, {
      replacements: {countryid, Citytype},
      type: Sequelize.QueryTypes.RAW,
    });
    return resultPass; 
  }catch(error){
    console.error('Error calling stored procedure:', error);
    throw error;
  }
}

export { getcountry,getStateListbycountry,getpostadatabyCountry, getCityListByCountry};