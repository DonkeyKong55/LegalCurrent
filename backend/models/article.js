'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Article.init({
    title: DataTypes.STRING,
    summary: DataTypes.TEXT,
    full_content: DataTypes.TEXT,
    category: DataTypes.STRING,
    publication_date: DataTypes.DATE,
    source_url: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Article',
  });
  return Article;
};