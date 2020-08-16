import Vue from 'vue'
import { Button, Input, Loading, Popover, DatePicker, Message, Switch, Notification } from 'element-ui'
import './theme/index.css'

Vue.use(Button)
Vue.use(Input)
Vue.use(Loading)
Vue.use(Popover)
Vue.use(DatePicker)
Vue.use(Switch)

Vue.prototype.$message = Message;
Vue.prototype.$notify = Notification;