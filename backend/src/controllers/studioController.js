const Studio = require('../models/Studio');

const getStudios = async (req, res, next) => {
  try {
    const studios = await Studio.find().sort({ name: 1 });
    res.status(200).json(studios);
  } catch (error) {
    next(error);
  }
};

const getStudioById = async (req, res, next) => {
  try {
    const studio = await Studio.findById(req.params.id);
    if (!studio) {
      res.status(404);
      throw new Error('Studio not found');
    }
    res.status(200).json(studio);
  } catch (error) {
    next(error);
  }
};

const createStudio = async (req, res, next) => {
  try {
    const studio = await Studio.create(req.body);
    res.status(201).json(studio);
  } catch (error) {
    next(error);
  }
};

const updateStudio = async (req, res, next) => {
  try {
    const studio = await Studio.findById(req.params.id);
    if (!studio) {
      res.status(404);
      throw new Error('Studio not found');
    }

    Object.assign(studio, req.body);
    const updatedStudio = await studio.save();
    res.status(200).json(updatedStudio);
  } catch (error) {
    next(error);
  }
};

const deleteStudio = async (req, res, next) => {
  try {
    const studio = await Studio.findById(req.params.id);
    if (!studio) {
      res.status(404);
      throw new Error('Studio not found');
    }
    await studio.deleteOne();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudios,
  getStudioById,
  createStudio,
  updateStudio,
  deleteStudio,
};
