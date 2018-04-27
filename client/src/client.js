import _ from 'lodash';

const client = (function () {
  function getOrders(success) {
    return fetch('/api/orders', {
      headers: {
        Accept: 'application/json',
      },
    }).then(checkStatus)
      .then(parseJSON)
      .then(success);
  }

  function getMenu(success) {
    return fetch('/api/menu', {
      headers: {
        Accept: 'application/json',
      },
    }).then(checkStatus)
      .then(parseJSON)
      .then(success);
  }

  function getItemPrice(item){
    if(_.get(menu, ['Piva', item])){
      return _.get(menu, ['Piva', item]);
    } else if(_.get(menu, ['Sokovi', item])){
      return _.get(menu, ['Sokovi', item])
    } else {
      return 'unknown';
    }
  }

  function deleteOrder(data) {
    return fetch('/api/orders', {
      method: 'delete',
      body: JSON.stringify(data),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(checkStatus);
  }

  function sendLogInStatus(status){
    return fetch('/api/loggedin', {
      method: 'post',
      body: {"loggedIn": status},
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(checkStatus);
  }
  
  function createOrder(data) {
    return fetch('/api/orders', {
      method: 'post',
      body: JSON.stringify(data),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(checkStatus);
  }

  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      const error = new Error(`HTTP Error ${response.statusText}`);
      error.status = response.statusText;
      error.response = response;
      console.log(error);
      throw error;
    }
  }

  function parseJSON(response) {
    return response.json();
  }

  function millisecondsToHuman(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const hours = Math.floor(ms / 1000 / 60 / 60);

    const humanized = [
      pad(hours.toString(), 2),
      pad(minutes.toString(), 2),
      pad(seconds.toString(), 2),
    ].join(':');

    return humanized;
  }

  function pad(numberString, size) {
    let padded = numberString;
    while (padded.length < size) padded = `0${padded}`;
    return padded;
  }

  return {
    getOrders,
    deleteOrder,
    createOrder,
    millisecondsToHuman,
    pad,
    getMenu,
    getItemPrice
  };
}());

var menu;
client.getMenu((loadedMenu) => {
  menu = loadedMenu;
})

export default client;