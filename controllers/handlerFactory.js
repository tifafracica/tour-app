const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { Model } = require('mongoose');
const { populate } = require('../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');


exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id)

    if (!document) {
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
        status: 'sucess',
        data: null
    })
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!document) {
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
        status: 'sucess',
        data: {
            data: document
        }
    })

});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);

    res.status(201).json({
        status: 'sucess',
        data: {
            data: document
        }
    });
});

exports.getOne = (Model, populateOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (populateOptions) query = query.populate(populateOptions);
        const document = await query

        if (!document) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                document // es lo mismo si escribes document: document
            }
        })

    });

exports.getAll = Model => catchAsync(async (req, res, next) => {
    // solo para los nested routes de los reviews// hack

    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
    const document = await features.query;

    // 3. ENVIAMOS LA RESPUESTA
    res.status(200).json({
        status: 'success',
        results: document.length,
        data: {
            data: document
        }
    })

});