import express from 'express';

export const applyBodyParsing = (app) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
}