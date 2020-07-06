import Vue from 'vue'
import { Button, Input, Loading, Popover, DatePicker, Message, Notification } from 'element-ui'
import './theme/index.css'

Vue.use(Button)
Vue.use(Input)
Vue.use(Loading)
Vue.use(Popover)
Vue.use(DatePicker)

Vue.prototype.$message = Message;
Vue.prototype.$notify = Notification;