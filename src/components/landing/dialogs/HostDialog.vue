<template>
  <el-dialog
    class="dialog dialog-theme"
    title="节点设置 (Beta)"
    :width="dialogWidth"
    :visible.sync="show"
    append-to-body
  >
    <el-form label-position="left" :label-width="labelWidth" :model="hostForm">
      <el-form-item label="启用自定义节点"> </el-form-item>
      <el-form-item label=""> </el-form-item>
      <el-form-item label=""> </el-form-item>
    </el-form>
  </el-dialog>
</template>
