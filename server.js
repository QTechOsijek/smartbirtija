/* eslint-disable no-param-reassign */
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();

var i = 1;

const DATA_FILE = path.join(__dirname, 'data.json');

app.set('port', (process.env.PORT || 3001));

app.use('/', express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

fs.writeFile(DATA_FILE, '[]');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
})

app.get('/api/orders', (req, res) => {
  fs.readFile(DATA_FILE, (err, data) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.json(JSON.parse(data));
  });
});

app.post('/api/orders', (req, res) => {
  fs.readFile(DATA_FILE, (err, data) => {
    const orders = JSON.parse(data);
    const newOrder = {
      id: i,
      items: req.body.items,
      price: req.body.price,
      table: req.body.table,
      runningSince: Date.now()
    };
    console.log(req.body.items);
    console.log(req.body.price);
    orders.push(newOrder);
    i++;
    fs.writeFile(DATA_FILE, JSON.stringify(orders, null, 4), () => {
      res.setHeader('Cache-Control', 'no-cache');
      res.json(orders);
    });
  });
});

app.get('/api/menu', (req, res) => {
  const menu = {
    "Piva": {"Heineken": 13, "Osjecko": 13}, 
    "Sokovi": {"Cedevita": 11, "Cola": 12}
  };
  res.json(menu);
})

app.delete('/api/orders', (req, res) => {
  fs.readFile(DATA_FILE, (err, data) => {
    let orders = JSON.parse(data);
    orders = orders.reduce((memo, order) => {
      if (order.id === req.body.id) {
        return memo;
      } else {
        return memo.concat(order);
      }
    }, []);
    fs.writeFile(DATA_FILE, JSON.stringify(orders, null, 4), () => {
      res.json({});
    });
  });
});

app.get('/molasses', (_, res) => {
  setTimeout(() => {
    res.end();
  }, 5000);
});

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
