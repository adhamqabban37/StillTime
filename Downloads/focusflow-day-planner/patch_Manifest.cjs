const fs = require('fs');
let text = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');

const receiverXml = `
        <receiver android:name=".widget.FocusFlowWidgetProvider" android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/focus_flow_widget_info" />
        </receiver>
`;

text = text.replace('</application>', receiverXml + '\n    </application>');
fs.writeFileSync('android/app/src/main/AndroidManifest.xml', text);
