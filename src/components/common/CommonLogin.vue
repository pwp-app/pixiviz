<template>
  <el-dialog class="dialog dialog-login" :title="dialogTitle" :visible.sync="show" append-to-body>
    <el-form label-position="left" :model="loginForm" v-if="mode === 'login'">
      <el-form-item label="用户名">
        <el-input v-model="loginForm.username"></el-input>
      </el-form-item>
      <el-form-item label="密码">
        <el-input
          type="password"
          v-model="loginForm.password"
          @keyup.enter.native="submit"
        ></el-input>
      </el-form-item>
    </el-form>
    <el-form label-position="left" :model="registerForm" v-else>
      <el-form-item label="用户名">
        <el-input v-model="registerForm.username"></el-input>
      </el-form-item>
      <el-form-item label="密码">
        <el-input type="password" v-model="registerForm.password"></el-input>
      </el-form-item>
      <el-form-item label="确认密码">
        <el-input
          type="password"
          v-model="registerForm.confirmPassword"
          @keyup.enter.native="submit"
        ></el-input>
      </el-form-item>
      <p class="dialog-login-desc">
        请务必妥善保管好您的密码，一旦密码丢失，您的数据将不可找回！
      </p>
    </el-form>
    <div slot="footer" class="dialog-login-action">
      <el-button type="default" @click="switchMode">{{ switchText }}</el-button>
      <el-button type="primary" @click="submit">{{ submitText }}</el-button>
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
    dialogTitle() {
      return this.mode === 'login' ? '登录 Pixland' : '注册';
    },
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
        const username = this.loginForm.username?.trim() || '';
        const password = this.loginForm.password?.trim() || '';

        // validate
        if (!username) {
          this.$message.error('你...，你好像还没有输入用户名呢...');
          return;
        }
        if (!password) {
          this.$message.error('密码不能是空的哟~，请再试一次');
          return;
        }

        try {
          await this.pixland.login(username, password);
          this.$message.success('登录成功');
          this.show = false;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[Pixland] Login failed.', err);
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

      const username = this.registerForm.username?.trim() || '';
      const password = this.registerForm.password?.trim() || '';
      const confirmPassword = this.registerForm.confirmPassword?.trim() || '';

      // validate
      if (!username) {
        this.$message.error('你...，你好像还没有输入用户名呢...');
        return;
      }
      if (!password) {
        this.$message.error('密码不能是空的哟~，请再试一次');
        return;
      }
      if (!confirmPassword) {
        this.$message.error('确认密码不能是空的哟~，请再试一次');
        return;
      }
      if (password !== confirmPassword) {
        this.$message.error('两次输入的密码不一样呢~，请再试一次');
        return;
      }

      try {
        await this.pixland.register(username, password, confirmPassword);
        this.$message.success('注册成功');
        this.show = false;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[Pixland] Register failed.', err);
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
