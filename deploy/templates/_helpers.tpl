{{- define "app.hostname" -}}
{{ printf "%s-%s.%s" .Values.name (.Values.branch | replace "." "-" | replace "/" "-") .Values.rootDomain }}
{{- end -}}
