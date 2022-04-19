import '@lwc/synthetic-shadow';
import { createElement } from 'lwc';
import ExtractData from './extract-data/extract-data';

const activity = createElement('c-extract-data', { is: ExtractData });

document.querySelector('#main').appendChild(activity);
