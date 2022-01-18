<template>
  <el-dialog class="dialog dialog-login" title="登录 Pixland" :visible.sync="show" append-to-body>
    <el-form
      label-position="left"
      :label-width="labelWidth"
      :model="loginForm"
      v-if="mode === 'login'"
    >
      <el-form-item label="用户名">
        <el-input v-model="loginForm.username"></el-input>
      </el-form-item>
      <el-form-item label="密码">
        <el-input type="password" v-model="loginForm.password"></el-input>
      </el-form-item>
    </el-form>
    <el-form label-position="left" :label-width="labelWidth" :model="registerForm">
      <el-form-item label="用户名">
        <el-input v-model="registerForm.username"></el-input>
      </el-form-item>
      <el-form-item label="密码">
        <el-input type="password" v-model="registerForm.password"></el-input>
      </el-form-item>
      <el-form-item label="确认密码">
        <el-input type="password" v-model="registerForm.confirmPassword"></el-input>
      </el-form-item>
      <p class="dialog-login-desc">请务必妥善保管好您的密码，一旦密码丢失，您的数据将不可找回！</p>
    </el-form>
    <div class="dialog-login-action">
      <el-button type="primary" @click="submit">{{ submitText }}</el-button>
      <el-button type="primary" @click="switchMode">{{ switchText }}</el-button>
    </div>
  </el-dialog>
</template>

<script>
const DEFAULT_LOGIN_FORM = {
  username: '',
  password: '',
};

const DEFAULT_REGISTER_FORM = {
  username: '',
  password: '',
  confirmPassword: '',
};

export default {
  data() {
    return {
      mode: 'login',
      show: false,
      loginForm: { ...DEFAULT_LOGIN_FORM },
      registerForm: { ...DEFAULT_REGISTER_FORM },
      submitLoading: false,
    };
  },
  computed: {
    submitText() {
      return this.mode === 'login' ? '登录' : '注册';
    },
    switchText() {
      return this.mode === 'login' ? '没有帐号?' : '返回登录';
    },
  },
  methods: {
    open() {
      this.show = true;
      this.mode = 'login';
      this.resetForm();
    },
    resetForm() {
      this.loginForm = { ...DEFAULT_LOGIN_FORM };
      this.registerForm = { ...DEFAULT_REGISTER_FORM };
    },
    async submit() {
      if (this.mode === 'login') {
        const { username, password } = this.loginForm;
        try {
          await this.pixland.login(username, password);
          this.$message.success('登录成功');
          this.show = false;
        } catch (err) {
          if (err?.message === 'User does not exist.') {
            this.$message.error('用户名或密码错误，请重试');
            return;
          }
          this.$message.error('登录失败，请重试');
        } finally {
          this.submitLoading = false;
        }
        return;
      }
      const { username, password, confirmPassword } = this.registerForm;
      try {
        await this.pixland.register(username, password, confirmPassword);
        this.$message.success('注册成功');
        this.show = false;
      } catch (err) {
        if (err?.message === 'User exists.') {
          this.$message.error('用户名已存在，请换一个用户名再试~');
          return;
        }
        if (err?.message === 'Invalid confirm password.') {
          this.$message.error('两次输入的密码不一致，请重试');
          return;
        }
        this.$message.error('注册失败，请重试');
      } finally {
        this.submitLoading = false;
      }
    },
    switchMode() {
      if (this.mode === 'login') {
        this.mode = 'register';
        return;
      }
      this.mode = 'login';
    },
  },
};
</script>
