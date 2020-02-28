<template>
    <div class="rank-date-switcher">
        <el-date-picker
            v-model="selectDate"
            type="date"
            placeholder="选择日期"
            @change="handleChange"
            :picker-options="pickerOpt"
            >
            </el-date-picker>
    </div>
</template>

<script>
export default {
    name: 'Rank.DateSwitcher',
    props: ['date'],
    data() {
        return {
            selectDate: this.date.toDate(),
            pickerOpt: {
                disabledDate: (time) => {
                    return time && time.valueOf() >= Date.now() - 86400000 * 3;
                }
            }
        }
    },
    methods: {
        handleChange(value) {
            this.$emit('date-selected', value);
        }
    }
}
</script>