import Vue from 'vue';
import { Button, Input, Loading, Popover, DatePicker, Message, Switch, Notification, Dialog, Form, FormItem } from 'element-ui';
import './theme/index.css';

Vue.use(Button);
Vue.use(Input);
Vue.use(Loading);
Vue.use(Popover);
Vue.use(DatePicker);
Vue.use(Switch);
Vue.use(Dialog);
Vue.use(Form);
Vue.use(FormItem);

Vue.prototype.$message = Message;
Vue.prototype.$notify = Notification;
