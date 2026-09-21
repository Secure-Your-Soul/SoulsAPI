export default function compareSemVer(v1: string, v2: string): number {
    const prereleaseOrder = ["alpha","beta","rc","dev"];
    if(!v1 || !v2) return -3;
    const [num1, pre1] = v1.split("-");
    const [num2, pre2] = v2.split("-");
    if(!num1 || !num2) return -3;
    const a1 = num1.split('.').map(Number);
    const a2 = num2.split('.').map(Number);

    for (let i = 0; i < Math.max(a1.length, a2.length); i++) {
        const n1 = a1[i] || 0;
        const n2 = a2[i] || 0;
        if (n1 > n2) return 1;
        if (n1 < n2) return -1;
    }

    if (!pre1 && pre2) return 1;   // stable > pre-release
    if (pre1 && !pre2) return -1;  // pre-release < stable
    if (!pre1 && !pre2) return 0;  // both stable
    if(!pre1 || !pre2) return -3;
    const i1 = prereleaseOrder.indexOf(pre1.split('.')[0] || '');
    const i2 = prereleaseOrder.indexOf(pre2.split('.')[0] || '');
    if (i1 > i2) return 1;
    if (i1 < i2) return -1;

    const nPre1 = Number(pre1.split('.')[1] || 0);
    const nPre2 = Number(pre2.split('.')[1] || 0);
    if (nPre1 > nPre2) return 1;
    if (nPre1 < nPre2) return -1;

    return 0;
}
