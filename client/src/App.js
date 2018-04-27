import React from 'react';
import './App.css';
import _ from 'lodash';
import JSON5 from 'json5';
import client from './client';
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";

class App extends React.Component{
  render(){
    return(
      <Router>
        <span>
          <Route exact path="/" component={Login} />
          <Route path="/dashboard" component={OrderList} />
          <Route path="/about" component={About} />
        </span>
      </Router>
    );
  }
}

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
    var keys = Object.keys(order.items);
    var i = 0;
    var totalPrice = 0;

    _.forEach(order.items, function(item){
      totalPrice += client.getItemPrice(keys[i]) * item;
    })

    order.price = totalPrice;
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

  handleRemoveClick = () => {
    this.props.onRemoveClick(this.props.id);
  };

  render(){
    const items = this.props.items.map((item) =>  (
      <Item
        key={Math.random()}
        product = {item}
        quantity = {this.props.quantities[item]}
        price = {client.getItemPrice(item)}
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
                placeholder='Item: Quantity'
                type='text'
                //value={this.state.items}
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

class Login extends React.Component{
  state = {
    username: '',
    password: '',
    enteredUsername: '',
    enteredPassword: '',
    
  }

  componentDidMount = () => {
    this.setState({username: 'admin', password: '123'});
  }

  handleUserChange = (e) => {
    this.setState({enteredUsername: e.target.value});
  }

  handlePassChange = (e) => {
    this.setState({enteredPassword: e.target.value});
  }

  verify = () => {
    if(this.state.username == this.state.enteredUsername 
      && this.state.password == this.state.enteredPassword){
        client.sendLogInStatus(true);
        window.location.replace('/dashboard');
      } else {
        alert("Wrong username or password!");
      }
  }

  render(){
    return(
      <div className='ui centered card'>
        <div className='content'>
          <div className='ui form'>
            <div className='field'>
              <label>Username</label>
              <input
                type='text'
                onChange={this.handleUserChange}
              />
            </div>
            <div className='field'>
              <label>Password</label>
              <input
                type='password'
                onChange={this.handlePassChange}
              />
            </div>
            <div className='ui blue bottom attached button' onClick={this.verify}>
              Log in
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class About extends React.Component{
  render(){
    return(
      <div className='ui segment'>
        <div className='ui large header'>About Smart Birtija</div>
        <p>Smart Birtija is a project aiming to boost the efficiency of cafes, bars, restaurants, nightclubs,
          etc. It enables waiters and bartenders to perform their jobs more productively, reducing waiting
          times for customers as a result.
        </p>
        <div className='ui small header'>How does it work?</div>
        <p>Each table is fitted with a mobile device, for example a low-end Android or iOS tablet, 
          or a Raspberry Pi with a touchscreen. A mobile app allows customers to view the menu and 
          place orders without having to wait for a waiter to come to them first. Placed orders are 
          instantly visible to the bartender/chef through a network-based dashboard. When the order
          is ready, the bartender/chef can remove it from the list and start working on the next one. 
          Orders can also be added manually. All orders are saved to a remote database.
        </p>
        <div className='ui small header'>Who made this?</div>
        <p>Visit our website <a href='http://qtechosijek.github.io'>here</a>.</p>
        <div className='ui basic center aligned segment'>
          <Link to="/">
            <button className='ui button'>
              Go to dashboard
            </button>
          </Link>
        </div>
      </div>  
    );
  }
}

export default App;