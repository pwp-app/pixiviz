import Vue from 'vue';
import {
  Button,
  Input,
  Loading,
  Popover,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Drawer,
  DatePicker,
  Message,
  Switch,
  Notification,
  Dialog,
  Form,
  FormItem,
  MessageBox,
} from 'element-ui';
import './theme/index.css';

Vue.use(Button);
Vue.use(Input);
Vue.use(Loading);
Vue.use(Popover);
Vue.use(DatePicker);
Vue.use(Switch);
Vue.use(Drawer);
Vue.use(Dialog);
Vue.use(Dropdown);
Vue.use(DropdownMenu);
Vue.use(DropdownItem);
Vue.use(Form);
Vue.use(FormItem);

Vue.prototype.$confirm = MessageBox.confirm;
Vue.prototype.$message = Message;
Vue.prototype.$notify = Notification;
