const express = require('express');
const app = express();
app.use(express.json());
app.listen(3000);

app.set('view engine', 'ejs');

// Route for demo frontend
app.get('/',(req,res) => {
    res.render('demofrontend');
})

// sample for demo frontend (srikanth's part)
const samplesearchhotelsRouter = require('./routes/samplesearchhotels');
app.use('/samplesearchhotels', samplesearchhotelsRouter);

// router for room details (nadine's part)
const hoteldetailsRouter = require('./routes/hoteldetails');
app.use('/hoteldetails', hoteldetailsRouter);

// router for additional hotel details (michael's part)
const additionalhoteldetailsRouter = require('./routes/additionalhoteldetails');
app.use('/additionalhoteldetails', additionalhoteldetailsRouter);

// Route for hotel details page
app.get('/hotel', (req, res) => {
    res.render('hoteldetailspage');
});
