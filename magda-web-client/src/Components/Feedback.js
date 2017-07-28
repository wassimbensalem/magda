import React from 'react';
import ReactDocumentTitle from 'react-document-title';
import {config} from '../config.js';

export default function Feedback(props) {
  return (
  <ReactDocumentTitle title={config.appName + ' | feedback'}>
    <div className='container feedback'>
      <h1>Feedback</h1>
      <a href="http://preview.data.gov.au/feedback.html" target="_blank">Give us feedback</a>
    </div>
    </ReactDocumentTitle>
  );
}
