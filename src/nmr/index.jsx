import ReactDOM from 'react-dom';
import React from 'react';

import Application from './app/Application.jsx';
import ServiceClient from './service/ServiceClient';

/* global document $:true */

function run() {
    $(document.body).append('<div id="root" />');
    ServiceClient.getInstance().login();
    const userId = ServiceClient.getInstance().userId;
    ReactDOM.render(<Application className="nm-application" userId={userId} />, document.getElementById('root'));
}

$(run());
