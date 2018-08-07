import {
  CATEGORIES_READ_REQUEST,
  USER_LOGOUT
} from '../constants';

const initialState = {};

function categories(state = initialState, action) {
  switch (action.type) {
  case CATEGORIES_READ_REQUEST:
    return Object.assign({}, state, {
      list: action.list,
      tree: action.tree
    });
  case USER_LOGOUT:
    return Object.assign({}, initialState);
  default:
    return state;
  }
}

export default categories;