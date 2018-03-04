const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const faker = require('faker');
const mongoose = require('mongoose');
const config = require('./config');

mongoose.connect(`mongodb://${config.db.user}:${config.db.password}@ds151908.mlab.com:51908/expressmovie`);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: cannot connect to my db'));
db.once('open', () => {
    console.log('connect to the db :-)');
});

const movieSchema = mongoose.Schema({
    movietitle: String,
    movieyear: Number
});

const Movie = mongoose.model('Movie', movieSchema);
// const title = faker.lorem.sentence(3);
// const year = Math.floor(Math.random() * 80) + 1950;
// const myMovie = new Movie({ movietitle: title, movieyear: year });
// myMovie.save((err, savedMovie) => {
//     if(err) {
//         console.error(err);
//     } else {
//         console.log('savedMovie', savedMovie);
//     }
// });

const PORT = 3000;

let frenchMovies = [];
const secret = 'jdqsifjapjfafjfljnfsqnfpazpfhafh5498494a4zafaf4a9a9ijqsDAFAFW';

// middleware qui permet de charger des fichier static
app.use('/public', express.static('public'));

// middleware express-jwt
app.use(expressJwt({ secret: secret }).unless({ path: ['/', '/movies', '/movie-search', '/login', new RegExp('/movies.*/', 'i'), new RegExp('/movie-details.*/', 'i')]}));


// middleware bodyparser permet de récuperer le contenu du body
// app.use(bodyParser.urlencoded({extended: false }));

// moteur de vue EJS
app.set('views', './views');
app.set('view engine', 'ejs');



// Route
app.get('/movies', (req, res) => {

    const title = "Mes films préférés";

    // frenchMovies = [
    //     { title: "Pull Fiction", year: 1998 },
    //     { title: "Le diner de cons", year: 1998 },
    //     { title: "Terminator", year: 1996 },
    //     { title: "Asterix", year: 2002 }
    // ];

    frenchMovies = [];
    Movie.find((err, movies) => {
        if (err) {
            console.error('could not retrieve movies from DB');
            res.sendStatus(500);
        } else {
            frenchMovies = movies;
            res.render('movies', { movies: frenchMovies, title: title });
        }
    })
    
});

//bodyParser middleware permet de récupérer le contenu du body
let urlencodedParser = bodyParser.urlencoded({ extended: false });

// app.post('/movies', urlencodedParser, (req, res) => {
//     console.log('le titre: ', req.body.movietitle);
//     console.log('l\'année: ', req.body.movieyear);

//     let newMovie = { title : req.body.movietitle, year: req.body.movieyear };
//     frenchMovies = [...frenchMovies, newMovie];
//     console.log(frenchMovies);
//     res.sendStatus(201);
// });

app.post('/movies', upload.fields([]), (req, res) => {
    if(!req.body) {
        return res.sendStatus(500);
    } else {
        const formData = req.body;
        console.log('formData: ', formData);
        
        // const newMovie = { title : req.body.movietitle, year: req.body.movieyear };
        // frenchMovies = [...frenchMovies, newMovie];
        // console.log(frenchMovies);
        // res.sendStatus(201);

        const title = req.body.movietitle;
        const year = req.body.movieyear;
        const myMovie = new Movie({ movietitle: title, movieyear: year });
        myMovie.save((error, savedMovie) => {
            if (error) {
                console.error(error);
                return;
            } else {
                console.log(savedMovie);
                res.sendStatus(201);
            }
        })
    }
});

app.get('/movies/:id', (req, res) => {
    const id = req.params.id;
    const title = req.params.title;
    res.render('moviesid', {movieid: id, movietitle: title});
})

app.put('/movies/:id', upload.fields([]), (req, res) => {
    if (!req.body) {
        return res.sendStatus(500);
    }
    console.log( 'movietitle : ', req.body.movietitle, 'movieyear : ', req.body.movieyear );
    const id = req.params.id;
    Movie.findByIdAndUpdate(id, {$set: {movietitle: req.body.movietitle, movieyear: req.body.movieyear}}, {new: true}, (err, movie) => {
        if(err) {
            console.error(err);
            return res.send("le film n'a pas pu être mis à jour ! ");
        }
        res.redirect('/movies');
    });
});

app.get('/movie-details/:id', (req, res) => {
    const id = req.params.id;
    Movie.findById(id, (err, movie) => {
        console.log('movie ', movie);
        res.render('movie-details', { movie : movie });
    });
});

app.post('/movie-details/:id', urlencodedParser, (req, res) => {
    console.log('req.body', req.body);
    if (!req.body) {
        return res.sendStatus(500);
    }
    const id = req.params.id;
    console.log( 'movietitle : ', req.body.movietitle, 'movieyear : ', req.body.movieyear );
    Movie.findByIdAndUpdate(id, {$set: {movietitle: req.body.movietitle, movieyear: req.body.movieyear}}, {new: true}, (err, movie) => {
        if(err) {
            console.error(err);
            return res.send("le film n'a pas pu être mis à jour ! ");
        }
        res.redirect('/movies');
    });
});

app.delete('/movie-details/:id', (req, res) => {
    const id = req.params.id;
    Movie.findByIdAndRemove(id, (err, movie) => {
        res.sendStatus(202);
    });
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/movie-search', (req, res) => {
    res.render('movie-search');
});

app.get('/login', (req, res) => {
    res.render('login', {title: 'Espace membre'});
});

const fakeUser = { email: 'test@gmail.com', password: 'aze'};

app.post('/login', urlencodedParser, (req, res) => {
    console.log('login post', req.body);
    if(!req.body) {
        return res.sendStatus(500);
    } else {
        if(fakeUser.email === req.body.email && fakeUser.password === req.body.password) {
            const myToken = jwt.sign({iss: 'http://expressmovies.fr', user: 'elhadi', scope: 'admin'}, secret);
            res.json(myToken);
        } else {
            res.sendStatus(401);
        }
    }
});

app.get('/member-only', (req, res) => {
    console.log('req.user', req.user);
    res.send(req.user);
});

// Port 3000
app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});