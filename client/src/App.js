import React from 'react';
import './App.css';
import _ from 'lodash';
import JSON5 from 'json5';

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
    getMenu
  };
}());

class OrderList extends React.Component{
  state = {
    orders: []
  };

  componentDidMount(){
    this.loadOrdersFromServer();
    setInterval(this.loadOrdersFromServer, 2000);
  }

  loadOrdersFromServer = () => {
    client.getOrders((serverOrders) => (
      this.setState({ orders: serverOrders })
      )
    );
  };

  handleRemove = (orderId) => {
    this.deleteOrder(orderId);
  };

  deleteOrder = (orderId) => {
    this.setState({
      orders: this.state.orders.filter(x => x.id !== orderId)
    });
    client.deleteOrder(
      { id: orderId }
    );
  };

  handleCreateFormSubmit = (order) => {
    this.createOrder(order);
  }

  createOrder = (order) => {
    /*
    const x = {
      id: order.id,
      items: order.items,
      price: order.price,
      table: order.table,
      runningSince: Date.now()
    };
    this.setState({
      orders: this.state.orders.concat(x)
    });
    */
    client.createOrder(order);
  }
  render(){
    const orders = this.state.orders.map((order) => (
      <Order
        key={order.id}
        id={order.id}
        items={order.items}
        price={order.price}
        table={order.table}
        quantities={order.quantities}
        runningSince={order.runningSince}
        onRemoveClick={this.handleRemove}
      />
    ));
    return(
      <div className='orders'>
        {orders}
        <ToggleableForm 
          onFormSubmit={this.handleCreateFormSubmit}
        />
      </div>
    );
  }
}

class Order extends React.Component{
  state = {
    menu: {},
  };

  componentDidMount(){
    client.getMenu((loadedMenu) => (
      this.setState({ menu: loadedMenu })
      )
    );
  };

  handleRemoveClick = () => {
    this.props.onRemoveClick(this.props.id);
  };

  getItemPrice = (item) => {
    if(_.get(this.state.menu, ['Piva', item])){
      return _.get(this.state.menu, ['Piva', item]);
    } else if(_.get(this.state.menu, ['Sokovi', item])){
      return _.get(this.state.menu, ['Sokovi', item])
    } else {
      return 'unknown';
    }
  };

  render(){
    const items = this.props.items.map((item) =>  (
      <Item
        key={Math.random()}
        product = {item}
        quantity = {this.props.quantities[item]}
        price = {this.getItemPrice(item)}
      />
    ));

    var totalPrice = 0;
    _.forEach(items, function(item){
      totalPrice += item.props.price * item.props.quantity;
    });

    return(
      <div className='ui raised segment'>
        <span className='ui medium header'>
          Order #{this.props.id}
        </span>
        <span className='right floated ui small header'>
          Table: {this.props.table}
        </span>
        {items}
        <span className='ui medium header'>
          Total price: {totalPrice.toFixed(2)} kn
        </span>
        <span className='ui right floated small header'>
          Waiting for: <Timer runningSince={this.props.runningSince} />
        </span>
        <div className='ui basic content center aligned segment'>
          <button className='ui negative basic button' onClick={this.handleRemoveClick}>
            Remove order
          </button>
        </div>
      </div>
    );
  }
}

class Item extends React.Component{
  render(){
    return(
      <div className='ui horizontal segments'>
        <div className='ui segment'>
          {this.props.product}
        </div>
        <div className='ui segment'>
          {this.props.quantity}
        </div>
        <div className='ui segment'>
          {this.props.price} kn
        </div>
      </div>
    );
  };
}

class Timer extends React.Component{
  componentDidMount(){
    this.forceUpdateInterval = setInterval(() => this.forceUpdate(), 50);
  }

  componentWillUnmount(){
    clearInterval(this.forceUpdateInterval);
  }

  render(){
    const delta = Date.now() - this.props.runningSince;
    const elapsedString = client.millisecondsToHuman(delta);
    return(
      <span>
        {elapsedString}
      </span>
    );
  }
}

class ToggleableForm extends React.Component{
  state = {
    isOpen: false
  };

  handleFormOpen = () => {
    this.setState({ isOpen: true });
  };

  handleFormClose = () => {
    this.setState({ isOpen: false });
  };

  handleFormSubmit = (order) => {
    this.props.onFormSubmit(order);
    this.setState({ isOpen: false });
  };

  render(){
    if(this.state.isOpen){
      return(
        <OrderForm
          onFormSubmit={this.handleFormSubmit}
          onFormClose={this.handleFormClose}
        />
      );
    } else {
      return(
        <div className='ui basic content center aligned segment'>
            <button
              className='ui basic button icon'
              onClick={this.handleFormOpen}
            >
              <i className='plus icon' />
            </button>
          </div>
      );
    }
  }
}

class OrderForm extends React.Component{
  state = {
    items: '',
    table: ''
  };

  handleItemChange = (e) => {
    this.setState({ items: e.target.value });
  };

  handleTableChange = (e) => {
    this.setState({ table: parseInt(e.target.value, 10) });
  };

  handleSubmit = () => {
    var obj = {
      items: {},
      table: this.state.table
    }
    this.setState({ items: this.state.items });
    try {
      obj.items = JSON5.parse("{" + this.state.items + "}");
    } catch(err){
      alert('Invalid input');
      return;
    }
    //client.createOrder(obj);
    this.props.onFormSubmit(obj);
  };

  render(){
    return (
      <div className='ui centered card'>
        <div className='content'>
          <div className='ui form'>
            <div className='field'>
              <label>Items</label>
              <input
                type='text'
                value={this.state.items}
                onChange={this.handleItemChange}
              />
            </div>
            <div className='field'>
              <label>Table</label>
              <input
                type='number'
                value={this.state.table}
                onChange={this.handleTableChange}
              />
            </div>
            <div className='ui two bottom attached buttons'>
              <button
                className='ui basic blue button'
                onClick={this.handleSubmit}
              >
                Create
              </button>
              <button
                className='ui basic red button'
                onClick={this.props.onFormClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
/*
ReactDOM.render(
  <OrderList />,
  document.getElementById('root')
);
*/

export default OrderList;